import type { LessonProgressResponse } from "./lessonProgressResponse";

export interface CourseProgressResponse {
  id: number;
  idUser: string;
  courseId: number;
  progressPercentage: number;
  startDate: string;
  completeDate?: string;
  isCompleted: boolean;
  lessonProgresses: LessonProgressResponse[];
}