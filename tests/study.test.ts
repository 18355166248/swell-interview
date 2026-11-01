import { describe, expect, it } from 'vitest';
import { createReviewQueue, defaultStore, parseStore, updateEntry } from '../src/domain/model';
import { questions } from '../src/data';
describe('学习与复习状态', () => {
  it('取消收藏不会丢失待复习状态', () => {
    let p = updateEntry({}, 'react-effect', { favorite: true, mastery: 'review' }, 1);
    p = updateEntry(p, 'react-effect', { favorite: false }, 2);
    expect(p['react-effect']).toMatchObject({ favorite: false, mastery: 'review' });
  });
  it('掌握后退出待复习但仍保留收藏，已开始的队列快照保持不变', () => {
    const p = updateEntry({}, 'react-effect', { favorite: true, mastery: 'review' }, 1);
    const queue = createReviewQueue(questions, p, 5);
    const next = updateEntry(p, 'react-effect', { mastery: 'mastered' }, 2);
    expect(createReviewQueue(questions, next, 5)).toEqual([]);
    expect(queue).toEqual(['react-effect']);
    expect(createReviewQueue(questions, next, 5, true)).toEqual(['react-effect']);
  });
  it('优先复习较早的记录并遵循每轮数量', () => {
    let p = updateEntry({}, 'react-effect', { mastery: 'review' }, 2);
    p = updateEntry(p, 'js-closure', { mastery: 'review' }, 1);
    expect(createReviewQueue(questions, p, 1)).toEqual(['js-closure']);
  });
  it('刷新前后的序列化记录一致，异常版本拒绝载入', () => {
    const store = { ...defaultStore, progress: updateEntry({}, 'react-key', { favorite: true, mastery: 'mastered' }, 1) };
    expect(parseStore(JSON.stringify(store))).toEqual(store);
    expect(() => parseStore('{bad')).toThrow();
    expect(() => parseStore(JSON.stringify({ ...store, version: 2 }))).toThrow();
  });
  it('题库 ID 唯一，来源与分类有效', () => {
    expect(new Set(questions.map(q => q.id)).size).toBe(questions.length);
    questions.forEach(q => { expect(q.answer.length).toBeGreaterThan(0); expect(q.sources[0].url).toMatch(/^https:\/\//); });
  });
});
