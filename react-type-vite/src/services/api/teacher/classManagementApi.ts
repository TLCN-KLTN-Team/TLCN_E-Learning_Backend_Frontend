import axiosInstance from "../httpClient/axiosInstance"
import type { ApiResponse } from "../response/apiResponse"
import type {ClassStudentStatsResponse } from "../response/studentEnrollmentResponse"
import type { StudentResponse } from "../response/studentResponse"

/**
 * Get detailed information about a specific student in a course
 * @param courseId - The course ID
 * @param studentId - The student ID
 * @returns Student details with progress information
 */
export const getStudentDetails = async (courseId: number, studentId: string): Promise<StudentResponse> => {
  const response = await axiosInstance.get<ApiResponse<StudentResponse>>(
    `/course-management/teacher/courses/students/${studentId}`,
  )
  return response.data.result
}



/**
 * Get statistics for a specific class
 * @param classId - The class ID
 * @returns Class statistics
 */
export const getClassStatisticsByClass = async (classId: number): Promise<ClassStudentStatsResponse> => {
  //const response = await axiosInstance.get<ApiResponse<ClassStudentStatsResponse>>(
  //  `/course-management/classes/${classId}/statistics`,
  //)
  //return response.data.result
  console.log(`[MOCK] Getting statistics for class ${classId}`)
  
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        totalStudents: 45,
        activeStudents: 42,
        averageScore: 8.5,
        completionRate: 0.85,
      })
    }, 500) // Giả lập delay network
  })
}
