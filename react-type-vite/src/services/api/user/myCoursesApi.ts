import axiosInstance from "../httpClient/axiosInstance";
import type { ApiResponse } from "../response/apiResponse";

const API_USER_COURSE_ENDPOINT = "/course-management/user/published-courses";

export interface EnrolledCourse {
  courseId: number;
  courseName: string;
  authorName: string;
  thumbnailUrl?: string;
  rating: number;
  duration: number;
  progress: number;
  lastAccessed?: string;
  totalLessons?: number;
  completedLessons?: number;
  enrolledDate?: string;
}

export interface PurchasedCourse {
  publishedCourseId: number;
  publishedCourseName: string;
  authorName: string;
  progressPercentage: number;
  thumbnailUrl?: string;
}

export interface EnrolledCoursesResponse {
  courses: EnrolledCourse[];
  totalCourses: number;
}

export interface PurchasedCoursesResponse {
  data: PurchasedCourse[];
  message: string;
}

const getEnrolledCourses = async (): Promise<EnrolledCoursesResponse> => {
  const response = await axiosInstance.get<EnrolledCoursesResponse>(
    `${API_USER_COURSE_ENDPOINT}/enrolled`
  );
  return response.data;
};

const getCourseProgress = async (courseId: number): Promise<number> => {
  const response = await axiosInstance.get<{ progress: number }>(
    `${API_USER_COURSE_ENDPOINT}/${courseId}/progress`
  );
  return response.data.progress;
};

const updateCourseProgress = async (
  courseId: number,
  lessonId: number,
  completed: boolean
): Promise<void> => {
  await axiosInstance.post(`${API_USER_COURSE_ENDPOINT}/${courseId}/progress`, {
    lessonId,
    completed,
  });
};

const getPurchasedCourses = async (): Promise<PurchasedCourse[]> => {
  const response = await axiosInstance.get<ApiResponse<PurchasedCourse[]>>(
    `${API_USER_COURSE_ENDPOINT}/purchased`
  );
  return response.data.result;
};

export default {
  getEnrolledCourses,
  getCourseProgress,
  updateCourseProgress,
  getPurchasedCourses,
};
