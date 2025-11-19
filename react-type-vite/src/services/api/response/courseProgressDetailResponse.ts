import type { CourseProgressResponse } from "./courseProgressResponse";

export interface CourseProgressDetailResponse {
  courseProgress: CourseProgressResponse;
  totalItems: number;
  completedItems: number;
  completedLessons: number;
  completedQuizzes: number;
  completedAssignments: number;
}