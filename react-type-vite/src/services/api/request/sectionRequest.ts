import type { AssignmentRequest } from "./assignmentRequest";
import type { LessonRequest } from "./lessonRequest";
import type { QuizRequest } from "./quizRequest";

export interface SectionRequest {
  id?: number;
  courseId?: number; // Removed from backend but keeping for frontend logic
  title: string;
  description?: string;
  orderIndex?: number;
  isPublished?: boolean;
  lessons?: LessonRequest[];
  quizzes?: QuizRequest[];
  assignments?: AssignmentRequest[]
}