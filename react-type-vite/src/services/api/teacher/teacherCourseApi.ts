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
  search = "",
  creditRange = "all",
): Promise<PaginatedResponse<CourseResponse>> => {
  const response = await axiosInstance.get<ApiResponse<any>>(
    `/course-management/teacher/courses/${teacherId}/paginated`,
    {
      params: {
        page,
        size,
        search: search.trim() || undefined,
        creditRange: creditRange === "all" ? undefined : creditRange,
      },
    },
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
  }
}

export interface CourseCardResponse {
  courseId: number;
  courseName: string;
}

export const getTeacherCourseCards = async (teacherId: string): Promise<CourseCardResponse[]> => {
  const response = await axiosInstance.get<ApiResponse<CourseCardResponse[]>>(
    `/course-management/teacher/courses/${teacherId}/cards`
  );
  return response.data.result;
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
