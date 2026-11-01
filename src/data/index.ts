import manifest from '../../question-bank/manifest.json';
const topicFiles = import.meta.glob('../../question-bank/topics/*/questions.json', { eager: true, import: 'default' });
// manifest 明确加载顺序；缺失分类直接报错，避免迁移后静默漏题。
const data = manifest.topics.flatMap(item => {
  const values = topicFiles[`../../question-bank/${item.file}`];
  if (!Array.isArray(values)) throw new Error(`题库分类文件缺失：${item.file}`);
  return values;
});
import sourceData from '../../question-bank/sources/interviews.json';
import type { Question, InterviewSource } from '../domain/model';
export const questions = data as Question[];
export const interviewSources = sourceData as InterviewSource[];
const sourceById = new Map(interviewSources.map(source => [source.id, source]));
export const getQuestion = (id?: string) => questions.find(q => q.id === id);
export function getQuestionEvidence(question: Question) {
  return (question.interviews ?? []).flatMap(evidence => {
    const source = sourceById.get(evidence.sourceId);
    return source ? [{ ...evidence, source }] : [];
  });
}
// 同一题可被多家公司记录；搜索读取来源映射，不把“公司问过”误当官方认证或频率。
export function getQuestionSearchText(question: Question) {
  return [question.title, question.prompt, question.topic, ...(question.aliases ?? []),
    ...getQuestionEvidence(question).flatMap(e => [e.source.company, e.source.role, e.source.title])].join(' ').toLowerCase();
}
