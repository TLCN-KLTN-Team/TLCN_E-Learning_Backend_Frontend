export interface LessonProgressResponse {
  id: number;
  lessonId: number;
  isCompleted?: boolean;
  completed?: boolean;
  courseProgressId: number;
}