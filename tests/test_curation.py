import copy
import importlib.util
import json
from pathlib import Path
import unittest
from unittest import mock
import tempfile
import shutil
import subprocess
import sys
import hashlib

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('curate', ROOT / 'question-bank/tools/curate.py')
curate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(curate)

class CurationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        _, cls.questions, cls.sources, _ = curate.load_bank(ROOT / 'question-bank')
        cls.batch = json.loads((ROOT / 'question-bank/curation/updates/2026-11-01-nowcoder.json').read_text())
        cls.new = next(c['question'] for c in cls.batch['changes'] if c['action'] == 'add')

    def test_current_bank_has_valid_sources_and_ids(self):
        curate.validate(self.questions, self.sources)

    def test_merge_preserves_id_answer_and_code(self):
        original = next(q for q in self.questions if q['id'] == 'react-effect')
        batch = {'version': 1, 'changes': [{'action': 'merge', 'id': original['id'], 'appendPoints': ['新增边界说明'], 'interviews': [], 'aliases': []}]}
        result, _ = curate.plan(self.questions, batch, self.sources)
        updated = next(q for q in result if q['id'] == original['id'])
        for key in ['id', 'answer', 'code']:
            self.assertEqual(updated.get(key), original.get(key))
        self.assertIn('新增边界说明', updated['points'])

    def test_same_canonical_key_cannot_be_duplicated(self):
        q = copy.deepcopy(self.questions[0]); q['id'] = 'different-id'; q['title'] = '换一种标题'; q['canonicalKey'] = self.questions[0].get('canonicalKey', self.questions[0]['id'])
        with self.assertRaises(ValueError): curate.validate(self.questions + [q], self.sources)

    def test_punctuation_change_is_still_duplicate_title(self):
        q = copy.deepcopy(self.questions[0]); q['id'] = 'other-id'; q['canonicalKey'] = 'other-key'; q['title'] += '？！'
        with self.assertRaises(ValueError): curate.validate(self.questions + [q], self.sources)

    def test_unknown_interview_source_is_rejected(self):
        q = copy.deepcopy(self.questions[0]); q['interviews'] = [{'sourceId': 'missing', 'locator': '第一题'}]
        with self.assertRaises(ValueError): curate.validate([q], self.sources)

    def test_alias_collision_is_rejected(self):
        q = copy.deepcopy(self.questions[0]); q['aliases'] = [self.questions[1]['title']]
        with self.assertRaises(ValueError): curate.validate([q, self.questions[1]], self.sources)

    def test_repeat_add_is_rejected(self):
        if any(q['id'] == self.new['id'] for q in self.questions):
            with self.assertRaises(ValueError): curate.plan(self.questions, {'version': 1, 'changes': [{'action': 'add', 'question': self.new}]}, self.sources)
        else:
            result, _ = curate.plan(self.questions, {'version': 1, 'changes': [{'action': 'add', 'question': self.new}]}, self.sources)
            with self.assertRaises(ValueError): curate.plan(result, {'version': 1, 'changes': [{'action': 'add', 'question': self.new}]}, self.sources)

    def test_tracking_parameters_removed_without_losing_document_anchor(self):
        self.assertEqual(curate.canonical_url('https://example.com/a?sourceSSR=search&lang=zh&utm_source=x#api'), 'https://example.com/a?lang=zh#api')

class PortableBankTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.bank = Path(self.temp.name) / 'moved-bank'
        shutil.copytree(ROOT / 'question-bank', self.bank, ignore=shutil.ignore_patterns('__pycache__'))

    def test_copied_bank_checks_and_exports_without_app(self):
        output = Path(self.temp.name) / 'bundle.json'
        tool = self.bank / 'tools/curate.py'
        completed = subprocess.run([sys.executable, str(tool), '--export', str(output)], cwd=self.temp.name, capture_output=True, text=True)
        self.assertEqual(completed.returncode, 0, completed.stderr)
        bundle = json.loads(output.read_text())
        _, questions, sources, _ = curate.load_bank(self.bank)
        self.assertEqual(bundle['questions'], questions)
        self.assertEqual(bundle['interviewSources'], sources)
        self.assertFalse((Path(self.temp.name) / 'src').exists())

    def test_unlisted_category_file_is_not_silently_skipped(self):
        path = self.bank / 'topics/extra/questions.json'; path.parent.mkdir(); path.write_text('[]')
        with self.assertRaisesRegex(ValueError, 'manifest'):
            curate.load_bank(self.bank)

    def test_wrong_category_is_rejected(self):
        path = self.bank / 'topics/html/questions.json'; values = json.loads(path.read_text()); values[0]['topic'] = 'CSS'
        path.write_text(json.dumps(values))
        with self.assertRaisesRegex(ValueError, '放错分类'):
            curate.load_bank(self.bank)

    def test_baseline_covers_sources_and_question_files(self):
        _, _, _, original = curate.load_bank(self.bank)
        for relative in ['sources/interviews.json', 'topics/html/questions.json']:
            path = self.bank / relative; path.write_bytes(path.read_bytes() + b' ')
            _, _, _, changed = curate.load_bank(self.bank)
            self.assertNotEqual(curate.fingerprint(original), curate.fingerprint(changed))
            path.write_bytes(original[relative])

    def test_failed_second_file_write_restores_first_file(self):
        manifest, questions, _, snapshot = curate.load_bank(self.bank)
        result = copy.deepcopy(questions)
        for topic in ['HTML', 'CSS']:
            next(q for q in result if q['topic'] == topic)['points'].append('异常恢复测试')
        real_write = curate.atomic_write
        calls = 0
        def fail_once(path, raw):
            nonlocal calls
            calls += 1
            if calls == 2: raise OSError('模拟第二个分类写入失败')
            real_write(path, raw)
        with mock.patch.object(curate, 'atomic_write', side_effect=fail_once):
            with self.assertRaises(OSError): curate.apply_bank(self.bank, manifest, result, snapshot)
        _, restored, _, current = curate.load_bank(self.bank)
        self.assertEqual(current, snapshot)
        self.assertEqual(restored, questions)

    def make_interrupted_journal(self):
        path = self.bank / 'topics/html/questions.json'
        old = path.read_bytes(); new = old + b' '
        record = {'file': 'topics/html/questions.json', 'oldText': old.decode(), 'oldSha256': hashlib.sha256(old).hexdigest(), 'newSha256': hashlib.sha256(new).hexdigest()}
        (self.bank / '.pending-update.json').write_text(json.dumps([record]))
        path.write_bytes(new)
        return path, old

    def test_interrupted_update_requires_recovery(self):
        path, old = self.make_interrupted_journal()
        with self.assertRaisesRegex(ValueError, '未完成'):
            curate.load_bank(self.bank)
        curate.recover(self.bank)
        self.assertEqual(path.read_bytes(), old)
        curate.load_bank(self.bank)

    def test_recovery_does_not_overwrite_external_changes(self):
        path, _ = self.make_interrupted_journal(); path.write_bytes(path.read_bytes() + b'  '); external = path.read_bytes()
        with self.assertRaisesRegex(ValueError, '外部修改'):
            curate.recover(self.bank)
        self.assertEqual(path.read_bytes(), external)
        self.assertTrue((self.bank / '.pending-update.json').exists())

if __name__ == '__main__': unittest.main()
