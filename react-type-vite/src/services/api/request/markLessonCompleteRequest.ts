export interface MarkLessonCompleteRequest {
  lessonId: number;
  classId?: number; // For student
  publishedCourseId?: number; // For user
}