import type { CourseResponse } from './courseResponse';
import type { CourseCategoryResponse } from './courseTypeResponse';
import type { SectionResponse } from './sectionResponse';


export interface PublishedCourseResponse {
  id: number;
  course: CourseResponse;
  courseType: CourseCategoryResponse;
  description: string;
  courseIntroduction: string;
  courseImage: string;
  courseVideo: string;
  learnerAchievements: string;
  courseLearner: string;
  courseTarget: string[];
  coursePrice: number;
  status: number; // 0: Draft, 1: Pending Approval, 2: Approved, 3: Rejected
  statusText: string;
  createdAt: string;
  updatedAt: string;
  publishedSections?: SectionResponse[]; // Sections với chỉ content đã published
  totalPublishedLessons?: number;
  totalPublishedQuizzes?: number;
  totalPublishedAssignments?: number;
}