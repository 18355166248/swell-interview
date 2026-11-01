export const topics = [
  { group: '前端基础', items: ['HTML', 'CSS', 'JavaScript'] },
  { group: '框架', items: ['React', 'Vue'] },
  { group: '工程与网络', items: ['TypeScript', '工程化', '网络与浏览器'] },
] as const;
export type Topic = (typeof topics)[number]['items'][number];
export type Mastery = 'unseen' | 'review' | 'mastered';
export interface Question {
  id: string; topic: Topic; title: string; difficulty: '基础' | '进阶'; prompt: string;
  answer: string[]; points: string[]; code?: string;
  sources: { label: string; url: string }[];
  origin: { label: string; url: string };
}
export interface ProgressEntry { favorite: boolean; mastery: Mastery; updatedAt: number }
export type ProgressMap = Record<string, ProgressEntry>;
export interface Settings { color: 'indigo' | 'blue' | 'violet'; scheme: 'light' | 'dark' | 'auto'; fontSize: number; reviewSize: string }
export interface Store { version: 1; progress: ProgressMap; settings: Settings }
export const defaultSettings: Settings = { color: 'indigo', scheme: 'light', fontSize: 16, reviewSize: '5' };
export const emptyEntry: ProgressEntry = { favorite: false, mastery: 'unseen', updatedAt: 0 };
export const defaultStore: Store = { version: 1, progress: {}, settings: defaultSettings };
// 收藏与掌握程度独立更新，取消收藏不会影响复习记录，掌握后也保留收藏。
export function updateEntry(progress: ProgressMap, id: string, patch: Partial<Pick<ProgressEntry, 'favorite' | 'mastery'>>, now = Date.now()): ProgressMap {
  return { ...progress, [id]: { ...(progress[id] ?? emptyEntry), ...patch, updatedAt: now } };
}
// 本轮固定快照：答题后题目不因退出待复习列表而消失，避免跳题和进度回退。
export function createReviewQueue(questions: Question[], progress: ProgressMap, limit: number, favoritesOnly = false): string[] {
  return questions.filter(q => favoritesOnly ? progress[q.id]?.favorite : progress[q.id]?.mastery === 'review')
    .sort((a, b) => (progress[a.id]?.updatedAt ?? 0) - (progress[b.id]?.updatedAt ?? 0))
    .slice(0, limit).map(q => q.id);
}
// 本机数据按版本读取；损坏或未知结构明确报错，由界面提示并暂停自动覆盖。
export function parseStore(raw: string | null): Store {
  if (!raw) return defaultStore;
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== 'object') throw new Error('数据格式无效');
  const s = value as Store;
  if (s.version !== 1 || !s.progress || typeof s.progress !== 'object' || Array.isArray(s.progress)) throw new Error('数据版本无效');
  for (const e of Object.values(s.progress)) {
    if (!e || typeof e.favorite !== 'boolean' || !['unseen', 'review', 'mastered'].includes(e.mastery) || !Number.isFinite(e.updatedAt)) throw new Error('学习记录无效');
  }
  const p = s.settings;
  if (!p || !['indigo', 'blue', 'violet'].includes(p.color) || !['light', 'dark', 'auto'].includes(p.scheme) || ![14, 16, 18].includes(p.fontSize) || !['5', '10', '20'].includes(p.reviewSize)) throw new Error('设置无效');
  return s;
}
