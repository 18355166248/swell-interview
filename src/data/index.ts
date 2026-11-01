import data from './questions.json';
import sourceData from './interview-sources.json';
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
