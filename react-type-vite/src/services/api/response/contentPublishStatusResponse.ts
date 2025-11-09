export interface ContentPublishStatusResponse {
  courseId: number;
  totalSections: number;
  publishedSections: number;
  totalLessons: number;
  publishedLessons: number;
  totalQuizzes: number;
  publishedQuizzes: number;
  totalAssignments: number;
  publishedAssignments: number;
  publishPercentage: number;
  sectionsUpdated?: number;
  lessonsUpdated?: number;
  quizzesUpdated?: number;
  assignmentsUpdated?: number;
  isPublished?: boolean;
}