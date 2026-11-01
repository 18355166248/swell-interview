import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';
import assert from 'node:assert/strict';
const bankUrl = new URL('../question-bank/', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('manifest.json', bankUrl), 'utf8'));
const questions = manifest.topics.flatMap(item => JSON.parse(readFileSync(new URL(item.file, bankUrl), 'utf8')));
function run(id, expression) {
  const q = questions.find(q => q.id === id);
  assert.ok(q?.code, `缺少可运行示例: ${id}`);
  return runInNewContext(`${q.code}\n${expression}`, { console: { log() {} } }, { timeout: 1000 });
}
test('固定行高虚拟区间在顶部、部分行、底部和空数据中不漏行', () => {
  assert.equal(run('perf-fixed-virtual-list', 'JSON.stringify(range(100, 20, 0, 100, 0))'), '[0,5]');
  assert.equal(run('perf-fixed-virtual-list', 'JSON.stringify(range(100, 20, 15, 100, 0))'), '[0,6]');
  assert.equal(run('perf-fixed-virtual-list', 'JSON.stringify(range(100, 20, 9999, 100, 2))'), '[93,100]');
  assert.equal(run('perf-fixed-virtual-list', 'JSON.stringify(range(0, 20, 0, 100))'), '[0,0]');
  assert.equal(run('perf-fixed-virtual-list', 'JSON.stringify(range(2, 20, -10, 100))'), '[0,2]');
});
test('扁平化示例保持值类型与输入不变', () => {
  const result = run('js-array-flat', `const input = [1, ['2', null, [undefined, true]], []]; const before = JSON.stringify(input); const result = flatten(input); JSON.stringify({result, unchanged: JSON.stringify(input) === before, fourthUndefined: result[3] === undefined});`);
  assert.deepEqual(JSON.parse(result), { result: [1, '2', null, null, true], unchanged: true, fourthUndefined: true });
});
test('构造示例支持普通函数及类，并遵循显式返回对象的语义', () => {
  assert.equal(run('js-new-operator', `class Item { constructor(value) { this.value = value; } }; construct(Item, [3]).value`), 3);
  assert.equal(run('js-new-operator', `function Item() { this.value = 1; return { value: 2 }; }; construct(Item, []).value`), 2);
  assert.equal(run('js-new-operator', `function Item() { this.value = 1; return 5; }; construct(Item, []).value`), 1);
});

test('promisify 保留 this，传播回调失败和同步抛错，首次结果不可改写', async () => {
  const result = await run('js-promisify', `(async () => {
    const item = { base: 4, load(n, cb) { cb(null, this.base + n); cb(null, 99); } };
    return promisifyOne(item.load).call(item, 3);
  })()`);
  assert.equal(result, 7);
  await assert.rejects(run('js-promisify', `promisifyOne(cb => cb(new Error('callback failed')))()`), /callback failed/);
  await assert.rejects(run('js-promisify', `promisifyOne(() => { throw new Error('sync failed'); })()`), /sync failed/);
});
test('稠密数组反转处理空、单项、奇偶长度并返回原数组', () => {
  for (const [input, expected] of [[[], []], [[1], [1]], [[1,2], [2,1]], [[1,2,3], [3,2,1]]]) {
    const result = run('js-array-reverse', `const a = ${JSON.stringify(input)}; const b = reverseDense(a); JSON.stringify({value:b,same:a===b});`);
    assert.deepEqual(JSON.parse(result), {value:expected,same:true});
  }
});
