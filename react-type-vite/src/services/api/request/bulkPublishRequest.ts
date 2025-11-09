export interface BulkPublishRequest {
  courseId: number;
  isPublished: boolean;
  sectionIds?: number[];
  lessonIds?: number[];
  quizIds?: number[];
  assignmentIds?: number[];
}