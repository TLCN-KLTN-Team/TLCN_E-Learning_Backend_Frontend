import axiosInstance from "../httpClient/axiosInstance";
import type { CourseRequest } from "../request/courseRequest";
import type { ApiResponse, PaginatedResponse } from "../response/apiResponse";
import type { CourseResponse } from "../response/courseResponse";

export const createCourse = async (
  institutionId: string,
  courseData: CourseRequest
): Promise<CourseResponse> => {
  const response = await axiosInstance.post<ApiResponse<CourseResponse>>(
    `/course-management/admin/institutions/${institutionId}/courses`,
    courseData
  );
  return response.data.result;
};

export const getCourses = async (
  institutionId: string,
  page: number = 0,
  size: number = 20
): Promise<PaginatedResponse<CourseResponse>> => {
  const response = await axiosInstance.get<ApiResponse<any>>(
    `/course-management/admin/institutions/${institutionId}/courses?page=${page}&size=${size}`
  );

  const result = response.data.result;

  return {
    content: result.content,
    page: result.number,              // map từ number
    size: result.size,
    totalElements: result.totalElements,
    totalPages: result.totalPages,
    first: result.first,
    last: result.last,
    hasNext: result.number < result.totalPages - 1,
    hasPrevious: result.number > 0,
    number: result.number,
  };
};

export const assignTeacherToCourse = async (
  institutionId: string,
  courseId: number,
  teacherId: string
): Promise<CourseResponse> => {
  console.log('API call - assignTeacherToCourse:', { institutionId, courseId, teacherId });
  const response = await axiosInstance.put<ApiResponse<CourseResponse>>(
    `/course-management/admin/institutions/${institutionId}/courses/${courseId}/assign-teacher?teacherId=${teacherId}`
  );
  return response.data.result;
};

export const removeTeacherFromCourse = async (
  institutionId: string,
  courseId: number
): Promise<CourseResponse> => {
  const response = await axiosInstance.put<ApiResponse<CourseResponse>>(
    `/course-management/admin/institutions/${institutionId}/courses/${courseId}/remove-teacher`
  );
  return response.data.result;
};

export const updateCourse = async (
  institutionId: string,
  courseId: number,
  courseData: Partial<CourseRequest>
): Promise<CourseResponse> => {
  const response = await axiosInstance.put<ApiResponse<CourseResponse>>(
    `/course-management/admin/institutions/${institutionId}/courses/${courseId}`,
    courseData
  );
  return response.data.result;
};

export const deleteCourse = async (
  institutionId: string,
  courseId: number
): Promise<void> => {
  await axiosInstance.delete(
    `/course-management/admin/institutions/${institutionId}/courses/${courseId}`
  );
};