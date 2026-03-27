import type { QuestionRequest } from "./questionRequest";

export interface QuizRequest {
  id?: number;
  sectionId?: number;
  title: string;
  description?: string;
  duration: number; // Made required to match backend
  attemptLimit?: number;
  passingLimit?: number;
  passingScore?: number; // Changed to number from backend Double
  numberItem?: number;
  showResults?: boolean;
  isPublished?: boolean;
  startTime?: string;
  endTime?: string;
  questions?: QuestionRequest[]; // For frontend display only
  questionIds?: number[]; // IDs for many-to-many relationship
  blueprintDraft?: { cloId: number; percentage: number }[]; // Local draft before persisted quizId exists
  createdAt?: string;
  updateAt?: string;
}