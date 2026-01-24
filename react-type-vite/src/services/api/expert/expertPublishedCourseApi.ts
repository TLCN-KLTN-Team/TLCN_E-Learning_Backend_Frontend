import axiosInstance from "../httpClient/axiosInstance";
import type { ApiResponse } from "../response/apiResponse";
import type { PublishedCourseResponse } from "../response/publishedCourseResponse";

/**
 * Get pending published courses for admin approval
 */
export const getPendingPublishedCourses = async (
  educationalUnitId: number,
  page: number = 0,
  size: number = 10
): Promise<{
  content: PublishedCourseResponse[],
  totalElements: number,
  totalPages: number,
  number: number,
  size: number
}> => {
  const response = await axiosInstance.get<ApiResponse<any>>(
    `/course-management/expert/educational-unit/${educationalUnitId}/published-courses/pending?page=${page}&size=${size}`
  );

  return response.data.result;
};

/**
 * Get all published courses for educational unit (with optional status filter)
 */
export const getPublishedCourses = async (
  educationalUnitId: number,
  status?: number,
  page: number = 0,
  size: number = 10
): Promise<{
  content: PublishedCourseResponse[],
  totalElements: number,
  totalPages: number,
  number: number,
  size: number
}> => {
  const statusParam = status !== undefined ? `&status=${status}` : '';
  const response = await axiosInstance.get<ApiResponse<any>>(
    `/course-management/expert/educational-unit/${educationalUnitId}/published-courses?page=${page}&size=${size}${statusParam}`
  );

  return response.data.result;
};

/**
 * Get published course details by ID
 */
export const getPublishedCourseById = async (
  educationalUnitId: number,
  publishedCourseId: number
): Promise<PublishedCourseResponse> => {
  const response = await axiosInstance.get<ApiResponse<PublishedCourseResponse>>(
    `/course-management/expert/educational-unit/${educationalUnitId}/published-courses/${publishedCourseId}`
  );

  return response.data.result;
};

/**
 * Approve a published course
 */
export const approvePublishedCourse = async (
  educationalUnitId: number,
  publishedCourseId: number
): Promise<PublishedCourseResponse> => {
  const response = await axiosInstance.post<ApiResponse<PublishedCourseResponse>>(
    `/course-management/expert/educational-unit/${educationalUnitId}/published-courses/${publishedCourseId}/approve`
  );

  return response.data.result;
};

/**
 * Reject a published course with reason
 */
export const rejectPublishedCourse = async (
  educationalUnitId: number,
  publishedCourseId: number,
  reason: string
): Promise<PublishedCourseResponse> => {
  const response = await axiosInstance.post<ApiResponse<PublishedCourseResponse>>(
    `/course-management/expert/educational-unit/${educationalUnitId}/published-courses/${publishedCourseId}/reject?reason=${encodeURIComponent(reason)}`
  );

  return response.data.result;
};