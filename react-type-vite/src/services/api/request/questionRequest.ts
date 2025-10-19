import type { AnswerRequest } from "./answerRequest";

export interface QuestionRequest {
  id?: number;
  quizId?: number;
  questionText: string;
  questionType: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
  orderIndex?: number;
  attachments?: string[]; // Added attachments array
  score: number;
  createdAt?: string;
  updateAt?: string;
  answers: AnswerRequest[]; // Changed from Set to Array for frontend
}