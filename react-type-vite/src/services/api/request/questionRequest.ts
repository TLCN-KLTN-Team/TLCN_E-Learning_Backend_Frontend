import type { AnswerRequest } from "./answerRequest";

export interface QuestionRequest {
  id?: number;
  quizId?: number;
  questionText: string;
  questionType: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY' | 'FILL_IN_THE_BLANK';
  orderIndex?: number;
  attachments?: string[]; // Added attachments array
  score: number;
  difficultyLevel?: string; // EASY, MEDIUM, HARD
  tags?: string; // Comma-separated tags
  createdAt?: string;
  updateAt?: string;
  answers: AnswerRequest[]; // Changed from Set to Array for frontend
}