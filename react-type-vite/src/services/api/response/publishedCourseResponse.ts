import type { CourseResponse } from './courseResponse';
import type { CourseDetailRequest } from '../request/publishCourseRequest';
import type { CourseCategoryResponse } from './courseTypeResponse';


export interface PublishedCourseResponse {
  id: number;
  course: CourseResponse;
  courseDetail: CourseDetailRequest;
  courseType: CourseCategoryResponse;
  coursePrice: number;
  status: number; // 0: Draft, 1: Pending Approval, 2: Approved, 3: Rejected
  statusText: string;
  createdAt: string;
  updatedAt: string;
  publishedSections?: any[]; // Replace 'any' with your SectionResponse type
  totalPublishedLessons?: number;
  totalPublishedQuizzes?: number;
  totalPublishedAssignments?: number;
}