#!/usr/bin/env python3
"""离线校验/预演/应用人工核验后的题库批次；不负责抓取或判断答案语义。"""
import argparse
import copy
import hashlib
import json
import os
from pathlib import Path
import re
import tempfile
import unicodedata
from urllib.parse import urlsplit, urlunsplit
from difflib import SequenceMatcher

TOPICS = {'HTML', 'CSS', 'JavaScript', 'React', 'Vue', 'TypeScript', '工程化', '网络与浏览器', 'Agent 工程'}

def normalized(text):
    return ''.join(c for c in unicodedata.normalize('NFKC', text).casefold() if c.isalnum())

def canonical_url(url):
    p = urlsplit(url)
    # 只去跟踪参数；知识文档片段和有语义的查询参数不能被粗暴删除。
    from urllib.parse import parse_qsl, urlencode
    query = [(k, v) for k, v in parse_qsl(p.query, keep_blank_values=True) if k != 'sourceSSR' and not k.startswith('utm_')]
    return urlunsplit((p.scheme, p.netloc.lower(), p.path.rstrip('/'), urlencode(query), p.fragment))

def require(ok, message):
    if not ok:
        raise ValueError(message)

def https(url):
    require(isinstance(url, str) and urlsplit(url).scheme == 'https' and bool(urlsplit(url).hostname), f'必须是有效 HTTPS 链接: {url}')

def validate(questions, sources):
    require(isinstance(questions, list) and isinstance(sources, list), '题库与来源目录必须是数组')
    source_map = {}
    urls = set()
    for s in sources:
        require(s.get('id') and s['id'] not in source_map, '来源 ID 重复或为空')
        https(s.get('url'))
        url = canonical_url(s['url'])
        require(url not in urls, f'重复来源 URL: {url}')
        require(s.get('company') and s.get('title') and s.get('evidenceLevel') == 'author-report', '面经必须记录公司、标题和作者自述属性')
        require(s.get('checkedAt') and s.get('publishedText'), '来源缺少访问日期或原始日期文本')
        urls.add(url); source_map[s['id']] = s
    ids, keys, titles, aliases = set(), set(), {}, {}
    for q in questions:
        ident = q.get('id')
        require(isinstance(ident, str) and re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', ident), f'无效题目 ID: {ident}')
        require(ident not in ids, f'题目 ID 重复: {ident}')
        key = q.get('canonicalKey', ident)
        require(key and key not in keys, f'知识点键重复: {key}')
        ids.add(ident); keys.add(key)
        require(q.get('topic') in TOPICS and q.get('difficulty') in {'基础', '进阶'}, f'{ident}: 分类/难度不合法')
        for field in ['title', 'prompt']:
            require(isinstance(q.get(field), str) and q[field].strip(), f'{ident}: {field} 不能为空')
        title = normalized(q['title'])
        require(title not in titles, f'标准化标题重复: {ident} / {titles.get(title)}')
        titles[title] = ident
        for field in ['answer', 'points']:
            require(isinstance(q.get(field), list) and q[field] and all(isinstance(v, str) and v.strip() for v in q[field]), f'{ident}: {field} 缺失')
        require(q.get('sources'), f'{ident}: 缺少答案参考资料')
        for ref in q['sources']:
            require(ref.get('label'), f'{ident}: 资料缺少名称'); https(ref.get('url'))
        require(q.get('origin', {}).get('label'), f'{ident}: 缺少选题出处'); https(q['origin'].get('url'))
        evidence = set()
        for e in q.get('interviews', []):
            require(e.get('sourceId') in source_map and e.get('locator'), f'{ident}: 面经来源或题目定位缺失')
            marker = (e['sourceId'], e['locator'])
            require(marker not in evidence, f'{ident}: 重复面经证据')
            evidence.add(marker)
        if q.get('review'):
            review = q['review']
            require(review.get('status') == 'verified' and review.get('scope'), f'{ident}: 核验状态/范围缺失')
            require(re.fullmatch(r'\d{4}-\d{2}-\d{2}', review.get('checkedAt', '')), f'{ident}: 核验日期无效')
        for alias in q.get('aliases', []):
            require(isinstance(alias, str) and alias.strip(), f'{ident}: 别名无效')
            marker = normalized(alias)
            require(marker not in aliases or aliases[marker] == ident, f'别名冲突: {alias}')
            aliases[marker] = ident
    for alias, ident in aliases.items():
        require(alias not in titles or titles[alias] == ident, f'别名与其他题标题重复: {ident}')
    return source_map

def plan(questions, batch, sources):
    require(batch.get('version') == 1 and isinstance(batch.get('changes'), list), '无效批次')
    result = copy.deepcopy(questions)
    by_id = {q['id']: q for q in result}
    counts = {'added': 0, 'merged': 0}
    handled = set()
    for change in batch['changes']:
        action = change.get('action')
        if action == 'add':
            q = copy.deepcopy(change['question']); ident = q['id']
            require(ident not in by_id, f'{ident}: 已存在，必须合并到原 ID，不能重复添加')
            require(q.get('canonicalKey') and q.get('interviews') and q.get('review', {}).get('status') == 'verified', f'{ident}: 新题必须完成知识点去重、原帖归属与答案核验')
            result.append(q); by_id[ident] = q; counts['added'] += 1
        elif action == 'merge':
            ident = change.get('id'); require(ident in by_id, f'合并目标不存在: {ident}')
            # 合并只追加证据、别名和追问；不允许重命名旧 ID 或覆盖答案/学习状态。
            require(set(change) <= {'action', 'id', 'interviews', 'appendPoints', 'aliases'}, f'{ident}: 合并包含未支持字段')
            q = by_id[ident]
            for target, source in [('interviews', 'interviews'), ('points', 'appendPoints'), ('aliases', 'aliases')]:
                old = q.setdefault(target, [])
                for item in change.get(source, []):
                    if item not in old: old.append(copy.deepcopy(item))
            counts['merged'] += 1
        else:
            raise ValueError(f'未知批次操作: {action}')
        require(ident not in handled, f'同一批次重复处理题目: {ident}'); handled.add(ident)
    validate(result, sources)
    return result, counts

def similarities(questions):
    # 模糊相似只提示复核，不能据此自动合并语义、框架或边界不同的题目。
    warnings = []
    for i, a in enumerate(questions):
        for b in questions[i + 1:]:
            score = SequenceMatcher(None, normalized(a['title']), normalized(b['title'])).ratio()
            if score >= .68:
                warnings.append({'ids': [a['id'], b['id']], 'similarity': round(score, 2)})
    return warnings

def bank_path(bank, relative):
    require(isinstance(relative, str) and relative, '分类路径不能为空')
    path = (bank / relative).resolve()
    require(path.is_relative_to(bank.resolve()), '分类文件不能引用题库目录之外的路径')
    return path

def load_bank(bank):
    bank = bank.resolve()
    require(not (bank / '.pending-update.json').exists(), '发现未完成批次；先执行 --recover 恢复，不能在部分更新上继续入库')
    manifest_raw = (bank / 'manifest.json').read_bytes()
    manifest = json.loads(manifest_raw)
    require(manifest.get('version') == 1 and isinstance(manifest.get('topics'), list), '题库 manifest 版本/分类无效')
    snapshot = {'manifest.json': manifest_raw}
    questions, topics, files = [], set(), set()
    for item in manifest['topics']:
        topic, relative = item['topic'], item['file']
        require(topic in TOPICS and topic not in topics and relative not in files, '分类或分类文件重复/无效')
        topics.add(topic); files.add(relative)
        raw = bank_path(bank, relative).read_bytes(); values = json.loads(raw)
        require(isinstance(values, list) and all(q.get('topic') == topic for q in values), f'{relative}: 题目放错分类')
        snapshot[relative] = raw; questions.extend(values)
    require(topics == TOPICS, 'manifest 必须完整列出全部分类')
    # 漏写 manifest 的题目不能在校验成功后悄悄消失。
    actual = {p.relative_to(bank).as_posix() for p in (bank / 'topics').glob('*/questions.json')}
    require(actual == files, '分类文件与 manifest 不一致，请检查漏列或多余文件')
    relative = manifest['sources']; raw = bank_path(bank, relative).read_bytes()
    require(relative not in snapshot, '来源路径与分类路径冲突')
    snapshot[relative] = raw; sources = json.loads(raw)
    validate(questions, sources)
    return manifest, questions, sources, snapshot

def fingerprint(snapshot):
    # 路径和内容均参与摘要，避免不同分类拆分产生相同基线；不依赖操作系统遍历顺序。
    digest = hashlib.sha256()
    for relative, raw in sorted(snapshot.items()):
        digest.update(relative.encode('utf-8') + b'\0' + str(len(raw)).encode() + b'\0' + raw)
    return digest.hexdigest()

def atomic_write(path, raw):
    temp = None
    try:
        with tempfile.NamedTemporaryFile(dir=path.parent, delete=False) as handle:
            temp = Path(handle.name); handle.write(raw); handle.flush(); os.fsync(handle.fileno())
        os.replace(temp, path)
    finally:
        if temp and temp.exists(): temp.unlink()

def recover(bank):
    journal = bank / '.pending-update.json'
    require(journal.exists(), '没有需要恢复的批次')
    records = json.loads(journal.read_text())
    # 恢复前先核对全部文件；若有人另作修改，拒绝覆盖而保留日志供人工处理。
    for record in records:
        current = bank_path(bank, record['file']).read_bytes()
        require(hashlib.sha256(current).hexdigest() in {record['oldSha256'], record['newSha256']}, f"{record['file']}: 发生外部修改，停止自动恢复")
    for record in records:
        atomic_write(bank_path(bank, record['file']), record['oldText'].encode('utf-8'))
    journal.unlink()

def apply_bank(bank, manifest, result, snapshot):
    changes = []
    for item in manifest['topics']:
        raw = (json.dumps([q for q in result if q['topic'] == item['topic']], ensure_ascii=False, indent=2) + '\n').encode('utf-8')
        previous = snapshot[item['file']]
        if raw != previous:
            changes.append({'file': item['file'], 'oldText': previous.decode('utf-8'), 'oldSha256': hashlib.sha256(previous).hexdigest(), 'newSha256': hashlib.sha256(raw).hexdigest(), 'newRaw': raw})
    require(all(bank_path(bank, name).read_bytes() == raw for name, raw in snapshot.items()), '写入前题库/来源发生变化，停止')
    if not changes: return
    # 多分类文件无法一次 rename。先独占创建恢复日志，再逐文件替换；中断后必须恢复，禁止继续覆盖。
    journal = bank / '.pending-update.json'
    with journal.open('x', encoding='utf-8') as handle:
        json.dump([{k:v for k,v in c.items() if k != 'newRaw'} for c in changes], handle, ensure_ascii=False, indent=2)
        handle.flush(); os.fsync(handle.fileno())
    try:
        require(all(bank_path(bank, name).read_bytes() == raw for name, raw in snapshot.items()), '保存恢复记录后题库发生变化，停止')
        for change in changes:
            atomic_write(bank_path(bank, change['file']), change['newRaw'])
    except Exception:
        recover(bank)
        raise
    journal.unlink()

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--bank', type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument('--batch', type=Path)
    parser.add_argument('--apply', action='store_true')
    parser.add_argument('--recover', action='store_true')
    parser.add_argument('--export', dest='export_path', type=Path)
    args = parser.parse_args(); bank = args.bank.resolve()
    require(not args.apply or args.batch, '--apply 必须指定 --batch')
    if args.recover:
        require(not args.batch and not args.apply and not args.export_path, '--recover 不能与其他写入组合')
        recover(bank); print('已恢复到批次应用前，请重新核对批次'); return
    manifest, questions, sources, snapshot = load_bank(bank)
    baseline = fingerprint(snapshot)
    result, counts = questions, {'added': 0, 'merged': 0}
    if args.batch:
        batch = json.loads(args.batch.read_text())
        require(batch.get('baseSha256') == baseline, '题库基线已改变，请重新核对去重与批次，不能直接覆盖')
        result, counts = plan(questions, batch, sources)
    report = {'mode': 'apply' if args.apply else 'check', 'before': len(questions), 'after': len(result), **counts, 'baseSha256': baseline, 'similarityReview': similarities(result)}
    if args.apply:
        apply_bank(bank, manifest, result, snapshot)
    if args.export_path:
        require(not args.batch or args.apply, '不导出尚未应用的批次草稿')
        target = args.export_path.resolve()
        require(not target.is_relative_to(bank), '导出文件请放到题库目录之外，避免当作第二份源数据维护')
        target.parent.mkdir(parents=True, exist_ok=True)
        bundle = {'version': 1, 'topics': [i['topic'] for i in manifest['topics']], 'questions': result, 'interviewSources': sources}
        atomic_write(target, (json.dumps(bundle, ensure_ascii=False, indent=2) + '\n').encode('utf-8'))
        report['exported'] = str(target)
    print(json.dumps(report, ensure_ascii=False, indent=2))

if __name__ == '__main__':
    try:
        main()
    except (ValueError, KeyError, TypeError, OSError) as error:
        raise SystemExit(f'校验失败: {error}')
