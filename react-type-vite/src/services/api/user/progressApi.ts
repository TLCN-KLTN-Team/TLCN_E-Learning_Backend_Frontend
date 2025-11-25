import axiosInstance from "../httpClient/axiosInstance";
import type { ProgressStatsResponse } from "../response/progressStatsResponse";
import type { CourseProgressDetailResponse } from "../response/courseProgressDetailResponse";
import type { ApiResponse } from "../response/apiResponse";

const API_PREFIX = "/course-management/user/progress";

/**
 * Get progress stats for a published course (user's enrolled course)
 */
export const getPublishedCourseProgress = async (
  publishedCourseId: number
): Promise<ProgressStatsResponse> => {
  const response = await axiosInstance.get<ApiResponse<ProgressStatsResponse>>(
    `${API_PREFIX}/published-course/${publishedCourseId}/stats`
  );
  return response.data.result;
};

/**
 * Get detailed progress for a published course
 */
export const getPublishedCourseProgressDetail = async (
  publishedCourseId: number
): Promise<CourseProgressDetailResponse> => {
  const response = await axiosInstance.get<ApiResponse<CourseProgressDetailResponse>>(
    `${API_PREFIX}/published-course/${publishedCourseId}/detail`
  );
  return response.data.result;
};

/**
 * Mark a lesson as complete
 */
export const markLessonComplete = async (data: {
  lessonId: number;
  publishedCourseId: number;
}): Promise<void> => {
  await axiosInstance.post(`${API_PREFIX}/lesson/complete`, data);
};

/**
 * Check if a lesson is completed
 */
export const isLessonCompleted = async (
  lessonId: number,
  publishedCourseId: number
): Promise<boolean> => {
  const response = await axiosInstance.get<ApiResponse<boolean>>(
    `${API_PREFIX}/lesson/${lessonId}/published-course/${publishedCourseId}/is-completed`
  );
  return response.data.result;
};

export default {
  getPublishedCourseProgress,
  getPublishedCourseProgressDetail,
  markLessonComplete,
  isLessonCompleted,
};
