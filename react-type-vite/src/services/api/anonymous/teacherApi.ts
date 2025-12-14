import axiosInstance from "../httpClient/axiosInstance";
import type { PaginatedResponse } from "../response/apiResponse";

export interface TeacherDetailResponse {
  id: number;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  description?: string;
  department?: {
    id: string;
    name: string;
    description?: string;
  };
  educationalUnit?: {
    id: number;
    name: string;
    description?: string;
  };
  totalPublishedCourses: number;
  totalStudents: number;
  averageRating: number;
}

export interface TeacherCoursesResponse {
  id: number;
  courseName: string;
  description?: string;
  courseIntroduction?: string;
  thumbnailUrl?: string;
  coursePrice: string;
  rating: number;
  enrolledCount: number;
  duration?: string;
  level?: string;
  category?: string;
}

class TeacherApiService {
  /**
   * Get teacher detail by ID
   */
  static async getTeacherDetail(
    teacherId: string
  ) : Promise<TeacherDetailResponse> {
    try {
      const response = await axiosInstance.get<any>(
        `/course-management/anonymous/teachers/${teacherId}`
      );
      return response.data.result;
    } catch (error) {
      console.error(
        `Error fetching teacher detail for ID ${teacherId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get teacher's published courses
   */
  static async getTeacherCourses(
    teacherId: string,
    page: number = 0,
    size: number = 10
  ) : Promise<PaginatedResponse<TeacherCoursesResponse>> {
    try {
      const response = await axiosInstance.get<any>(
        `/course-management/anonymous/teachers/${teacherId}/published-courses`,
        {
          params: {
            page,
            size,
          },
        }
      );
      return response.data.result;
    } catch (error) {
      console.error(
        `Error fetching teacher courses for ID ${teacherId}:`,
        error
      );
      throw error;
    }
  }
}

export default TeacherApiService;
