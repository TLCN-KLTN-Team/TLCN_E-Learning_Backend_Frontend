import axiosInstance from "../httpClient/axiosInstance";
import type { ProgressStatsResponse } from "../response/progressStatsResponse";
import type { CourseProgressResponse } from "../response/courseProgressResponse";
import type { ApiResponse } from "../response/apiResponse";

const API_PREFIX = "/course-management/user/progress";

export const getPublishedCourseProgress = async (
  publishedCourseId: number
): Promise<ProgressStatsResponse> => {
  const response = await axiosInstance.get<ApiResponse<ProgressStatsResponse>>(
    `${API_PREFIX}/published-course/${publishedCourseId}/stats`
  );
  return response.data.result;
};

export const getPublishedCourseProgressDetail = async (
  publishedCourseId: number
): Promise<CourseProgressResponse> => {
  const response = await axiosInstance.get<ApiResponse<CourseProgressResponse>>(
    `${API_PREFIX}/published-course/${publishedCourseId}/detail`
  );
  return response.data.result;
};

export const markLessonComplete = async (data: {
  lessonId: number;
  publishedCourseId: number;
}): Promise<void> => {
  await axiosInstance.post(`${API_PREFIX}/lesson/complete`, data);
};


