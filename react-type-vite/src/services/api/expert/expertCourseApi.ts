import axiosInstance from "../httpClient/axiosInstance";
import type { CourseRequest } from "../request/courseRequest";
import type { ApiResponse, PaginatedResponse } from "../response/apiResponse";
import type { CourseResponse } from "../response/courseResponse";

export interface CourseObjectivePayload {
  code: string;
  description?: string;
}

export interface CourseObjectiveResponse {
  id: number;
  courseId: number;
  courseName?: string;
  code: string;
  description?: string;
  isActive: boolean;
}

export const createCourse = async (
  educationalUnitId: number,
  courseData: CourseRequest
): Promise<CourseResponse> => {
  const response = await axiosInstance.post<ApiResponse<CourseResponse>>(
    `/course-management/expert/educational-unit/${educationalUnitId}/courses`,
    courseData
  );
  return response.data.result;
};

export const getCourses = async (
  educationalUnitId: number,
  page: number = 0,
  size: number = 20,
  search?: string
): Promise<PaginatedResponse<CourseResponse>> => {
  let url = `/course-management/expert/educational-unit/${educationalUnitId}/courses?page=${page}&size=${size}`;
  if (search && search.trim()) {
    url += `&search=${encodeURIComponent(search.trim())}`;
  }
  const response = await axiosInstance.get<ApiResponse<any>>(url);

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
  };
};

export const assignTeacherToCourse = async (
  educationalUnitId: number,
  courseId: number,
  teacherId: string
): Promise<CourseResponse> => {
  console.log('API call - assignTeacherToCourse:', { educationalUnitId, courseId, teacherId });
  const response = await axiosInstance.put<ApiResponse<CourseResponse>>(
    `/course-management/expert/educational-unit/${educationalUnitId}/courses/${courseId}/assign-teacher?teacherId=${teacherId}`
  );
  return response.data.result;
};

export const removeTeacherFromCourse = async (
  educationalUnitId: number,
  courseId: number
): Promise<CourseResponse> => {
  const response = await axiosInstance.put<ApiResponse<CourseResponse>>(
    `/course-management/expert/educational-unit/${educationalUnitId}/courses/${courseId}/remove-teacher`
  );
  return response.data.result;
};

export const updateCourse = async (
  educationalUnitId: number,
  courseId: number,
  courseData: Partial<CourseRequest>
): Promise<CourseResponse> => {
  const response = await axiosInstance.put<ApiResponse<CourseResponse>>(
    `/course-management/expert/educational-unit/${educationalUnitId}/courses/${courseId}`,
    courseData
  );
  return response.data.result;
};

export const getCourseObjectives = async (
  educationalUnitId: number,
  courseId: number,
  activeOnly: boolean = true
): Promise<CourseObjectiveResponse[]> => {
  const response = await axiosInstance.get<ApiResponse<CourseObjectiveResponse[]>>(
    `/course-management/expert/educational-unit/${educationalUnitId}/courses/${courseId}/clos?activeOnly=${activeOnly}`
  );
  return response.data.result;
};

export const createCourseObjective = async (
  educationalUnitId: number,
  courseId: number,
  payload: CourseObjectivePayload
): Promise<CourseObjectiveResponse> => {
  const response = await axiosInstance.post<ApiResponse<CourseObjectiveResponse>>(
    `/course-management/expert/educational-unit/${educationalUnitId}/courses/${courseId}/clos`,
    payload
  );
  return response.data.result;
};

export const updateCourseObjective = async (
  educationalUnitId: number,
  courseId: number,
  cloId: number,
  payload: CourseObjectivePayload
): Promise<CourseObjectiveResponse> => {
  const response = await axiosInstance.put<ApiResponse<CourseObjectiveResponse>>(
    `/course-management/expert/educational-unit/${educationalUnitId}/courses/${courseId}/clos/${cloId}`,
    payload
  );
  return response.data.result;
};

export const deactivateCourseObjective = async (
  educationalUnitId: number,
  courseId: number,
  cloId: number
): Promise<void> => {
  await axiosInstance.put(
    `/course-management/expert/educational-unit/${educationalUnitId}/courses/${courseId}/clos/${cloId}/deactivate`
  );
};

export const reactivateCourseObjective = async (
  educationalUnitId: number,
  courseId: number,
  cloId: number
): Promise<void> => {
  await axiosInstance.put(
    `/course-management/expert/educational-unit/${educationalUnitId}/courses/${courseId}/clos/${cloId}/reactivate`
  );
};