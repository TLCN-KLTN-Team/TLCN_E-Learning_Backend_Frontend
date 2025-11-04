import axiosInstance from "../httpClient/axiosInstance";
import type { ApiResponse, PaginatedResponse } from "../response/apiResponse";

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
  sections: Set<SectionContentResponse>;
}
export interface SectionContentResponse {
  id: number;
  title: string;
  description: string;
  lessons: Set<LessonContentResponse>;
}

export interface LessonContentResponse {
  id: number;
  content: string;
  title: string;
  description: string;
  videoUrl: string;
}

const COURSE_ENROLLMENT_API_BASE =
  "/course-management/student/course-enrollments";

const getCatalogEnrolledCourses = async (
  page: number,
  size: number,
  query: string
): Promise<PaginatedResponse<EnrolledCoursesResponse>> => {
  const response = await axiosInstance.get<
    ApiResponse<PaginatedResponse<EnrolledCoursesResponse>>
  >(`${COURSE_ENROLLMENT_API_BASE}/catalog`, {
    params: {
      page,
      size,
      query,
    },
  });

  return response.data.result;
};

const getEnrolledCourseContents = async (
  classId: number
): Promise<EnrolledCourseContentResponse> => {
  const response = await axiosInstance.get<
    ApiResponse<EnrolledCourseContentResponse>
  >(`${COURSE_ENROLLMENT_API_BASE}/class/${classId}/contents`);
  return response.data.result;
};

export default {
  getCatalogEnrolledCourses,
  getEnrolledCourseContents,
};
