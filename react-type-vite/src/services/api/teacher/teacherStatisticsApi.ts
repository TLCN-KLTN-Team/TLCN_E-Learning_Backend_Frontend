import axiosInstance from "../httpClient/axiosInstance"
import type { ApiResponse } from "../response/apiResponse"

export interface TeacherPublicStatisticsResponse {
  totalCoursesPublish: number
  totalUserPublish: number
  totalCourses: number
  totalStudents: number
  totalRevenue: number
  totalQuizAttempts: number
  totalAssignmentsSubmitted: number
  pendingAssignments: number
  averageCourseRating: number
}

/**
 * Get teacher's public statistics
 * @param teacherId - The teacher's ID
 * @returns Teacher statistics including courses, students, revenue, etc.
 */
export const getTeacherStatistics = async (
  teacherId: string
): Promise<TeacherPublicStatisticsResponse> => {
  const response = await axiosInstance.get<ApiResponse<TeacherPublicStatisticsResponse>>(
    `/course-management/teacher/public/statistics/${teacherId}`
  )
  return response.data.result
}
