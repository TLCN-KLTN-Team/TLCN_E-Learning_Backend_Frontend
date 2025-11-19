import axiosInstance from "../httpClient/axiosInstance"
import type { ApiResponse } from "../response/apiResponse"
import type { StudentResponse } from "../response/studentResponse"

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
