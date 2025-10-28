import axiosInstance from "../httpClient/axiosInstance"
import type { ApiResponse, PaginatedResponse } from "../response/apiResponse"
import type { CourseResponse } from "../response/courseResponse"

/**
 * Get all courses assigned to the current teacher
 * @param teacherId - The teacher's ID
 * @param page - Page number (0-indexed)
 * @param size - Number of items per page
 * @returns Paginated list of courses assigned to teacher
 */
export const getTeacherCourses = async (
  teacherId: string,
  page = 0,
  size = 20,
): Promise<PaginatedResponse<CourseResponse>> => {
  const response = await axiosInstance.get<ApiResponse<any>>(
    `/course-management/teacher/courses/${teacherId}/paginated?page=${page}&size=${size}`,
  )

  const result = response.data.result

  return {
    content: result.content,
    page: result.number,
    size: result.size,
    totalElements: result.totalElements,
    totalPages: result.totalPages,
    first: result.first,
    last: result.last,
    hasNext: result.number < result.totalPages - 1,
    hasPrevious: result.number > 0,
    number: result.number,
  }
}

/**
 * Get a specific course by ID
 * @param courseId - The course ID
 * @returns Course details
 */
export const getTeacherCourseById = async (courseId: number): Promise<CourseResponse> => {
  const response = await axiosInstance.get<ApiResponse<CourseResponse>>(`/course-management/courses/${courseId}`)
  return response.data.result
}

/**
 * Get course by ID
 * @param courseId - The course ID
 * @returns Course information
 */
export const getCourseById = async (courseId: number): Promise<any> => {
  const response = await axiosInstance.get<ApiResponse<any>>(`/course-management/teacher/courses/by-course/${courseId}`)
  return response.data.result
}
