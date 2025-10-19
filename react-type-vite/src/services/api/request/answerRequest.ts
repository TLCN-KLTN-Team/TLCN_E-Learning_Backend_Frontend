export interface AnswerRequest {
  id?: number;
  questionId?: number;
  content: string; // Changed from answerText to content
  isCorrect: boolean;
  orderIndex?: number;
  createdAt?: string;
  updateAt?: string;
}