import data from './questions.json';
import type { Question } from '../domain/model';
export const questions = data as Question[];
export const getQuestion = (id?: string) => questions.find(q => q.id === id);
