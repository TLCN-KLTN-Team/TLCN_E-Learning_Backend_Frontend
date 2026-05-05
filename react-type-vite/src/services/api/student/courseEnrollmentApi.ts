import axiosInstance from "../httpClient/axiosInstance";
import type { ApiResponse, PaginatedResponse } from "../response/apiResponse";
import type { CourseClassResponse } from "../response/courseClassResponse";
import type { SectionResponse } from "../response/sectionResponse";

export interface EnrolledCoursesResponse {
  courseId: number;
  classId: number;
  courseName: string;
  enrollmentDate: string;
  progressPercentage: number;
}

export interface EnrolledCourseContentResponse {
  courseName: string;
  schoolYear: number;
  description: string;
  progressPercentage: number;
  sections: Set<SectionResponse>;
}

const COURSE_ENROLLMENT_API_BASE =
  "/course-management/student/course-enrollments";

export const getCatalogEnrolledCourses = async (
  page: number,
  size: number,
  search: string,
  sortBy: string
): Promise<PaginatedResponse<EnrolledCoursesResponse>> => {
  const response = await axiosInstance.get<
    ApiResponse<PaginatedResponse<EnrolledCoursesResponse>>
  >(`${COURSE_ENROLLMENT_API_BASE}/catalog`, {
    params: {
      page,
      size,
      search,
      sortBy,
    },
  });

  return response.data.result;
};

export const getEnrolledCourseContents = async (classId: number): Promise<SectionResponse[]> => {
  const response = await axiosInstance.get<ApiResponse<SectionResponse[]>>(`${COURSE_ENROLLMENT_API_BASE}/class/${classId}/contents`);
  return response.data.result
}

export const getClassById = async (classId: number): Promise<CourseClassResponse> => {
  const response = await axiosInstance.get<ApiResponse<CourseClassResponse>>(`${COURSE_ENROLLMENT_API_BASE}/class/${classId}`);
  return response.data.result
}

export default {
  getCatalogEnrolledCourses,
  getEnrolledCourseContents,
  getClassById
};
