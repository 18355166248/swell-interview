import { useCallback, useEffect, useState } from 'react';
import { defaultStore, parseStore, updateEntry, type Store, type Settings, type Mastery } from './model';
// 项目改名后保留既有存储键，避免 Web 预览中的学习记录丢失。
const KEY = 'interview-shiguang:v1';
export function useStore() {
  const [initial] = useState(() => {
    try { return { store: parseStore(localStorage.getItem(KEY)), error: '' }; }
    catch { return { store: defaultStore, error: '本机记录暂时无法读取，原始数据已保留。请检查浏览器存储权限；本次修改仅在当前会话生效。' }; }
  });
  const [store, setStore] = useState(initial.store);
  const [error, setError] = useState(initial.error);
  // 读取失败时不覆盖可能仍可恢复的旧数据；持久化失败仍保留当前会话。
  useEffect(() => {
    if (initial.error) return;
    try { localStorage.setItem(KEY, JSON.stringify(store)); }
    catch { setError('本机存储空间不足或不可用，本次修改仅在当前会话生效。'); }
  }, [store, initial.error]);
  const commit = useCallback((change: (s: Store) => Store) => {
    setStore(previous => change(previous));
  }, []);
  return {
    store, error,
    toggleFavorite: (id: string) => commit(s => ({ ...s, progress: updateEntry(s.progress, id, { favorite: !s.progress[id]?.favorite }) })),
    rate: (id: string, mastery: Mastery) => commit(s => ({ ...s, progress: updateEntry(s.progress, id, { mastery }) })),
    setSettings: (patch: Partial<Settings>) => commit(s => ({ ...s, settings: { ...s.settings, ...patch } })),
  };
}
export type StudyStore = ReturnType<typeof useStore>;
