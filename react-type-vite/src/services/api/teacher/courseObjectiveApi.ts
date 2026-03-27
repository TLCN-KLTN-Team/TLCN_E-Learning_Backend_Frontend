import axiosInstance from "../httpClient/axiosInstance"
import type { ApiResponse } from "../response/apiResponse"

export interface CourseObjectiveResponse {
  id: number
  courseId: number
  courseName?: string
  code: string
  description?: string
  isActive: boolean
}

export const getTeacherActiveClos = async (): Promise<CourseObjectiveResponse[]> => {
  const response = await axiosInstance.get<ApiResponse<CourseObjectiveResponse[]>>(
    "/course-management/teacher/clos"
  )
  return response.data.result
}
