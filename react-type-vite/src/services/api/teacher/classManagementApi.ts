import axiosInstance from "../httpClient/axiosInstance"
import type { ApiResponse, PaginatedResponse } from "../response/apiResponse"
import type { StudentResponse } from "../response/studentResponse"
import type { CourseClassResponse } from "../response/courseClassResponse"

/**
 * Get all classes for a specific course
 * @param educationalUnitId - The educational unit ID (kept for interface consistency, but unused in new endpoint)
 * @param courseId - The course ID
 * @returns List of classes
 */
export const getClassesByCourse = async (
  _educationalUnitId: number,
  courseId: number,
): Promise<PaginatedResponse<CourseClassResponse>> => {
  const response = await axiosInstance.get<ApiResponse<PaginatedResponse<CourseClassResponse>>>(
    `/course-management/teacher/courses/${courseId}/classes`,
    {
      params: {
        page: 0,
        size: 100, // Get all classes
      },
    }
  )
  return response.data.result
}



/**
 * Get detailed information about a specific student in a course
 * @param classId - The course ID
 * @param studentId - The student ID
 * @returns Student details with progress information
 */
export const getStudentDetails = async (classId: number, studentId: string): Promise<StudentResponse> => {
  const response = await axiosInstance.get<ApiResponse<StudentResponse>>(
    `/course-management/teacher/courses/${classId}/students/${studentId}`,
  )
  return response.data.result
}

import type { ClassStudentStatsResponse } from "../response/studentEnrollmentResponse"

export const getStudentsInClass = async (
  _educationalUnitId: number,
  classId: number
): Promise<StudentResponse[]> => {
  // educationalUnitId is kept for interface consistency but unused
  const response = await axiosInstance.get<ApiResponse<StudentResponse[]>>(
    `/course-management/teacher/courses/classes/${classId}/students`
  );
  return response.data.result;
};

export const getClassStatisticsByClass = async (
  _educationalUnitId: number,
  classId: number
): Promise<ClassStudentStatsResponse> => {
  const response = await axiosInstance.get<ApiResponse<ClassStudentStatsResponse>>(
    `/course-management/teacher/courses/classes/${classId}/statistics`,
  )
  return response.data.result
}

export const getAvailableStudentsForClass = async (
  educationalUnitId: number,
  classId: number
): Promise<StudentResponse[]> => {
  const response = await axiosInstance.get<ApiResponse<StudentResponse[]>>(
    `/course-management/teacher/courses/classes/${classId}/available-students?educationalUnitId=${educationalUnitId}`
  );
  return response.data.result;
};

export const enrollStudentsToClass = async (
  _educationalUnitId: number,
  classId: number,
  studentIds: string[]
): Promise<void> => {
  await axiosInstance.post(
    `/course-management/teacher/courses/classes/${classId}/enroll-students`,
    studentIds
  );
};

export const unenrollStudentFromClass = async (
  _educationalUnitId: number,
  classId: number,
  studentId: string
): Promise<void> => {
  await axiosInstance.delete(
    `/course-management/teacher/courses/classes/${classId}/students/${studentId}`
  );
};
