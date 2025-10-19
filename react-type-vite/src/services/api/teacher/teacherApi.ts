import axiosInstance from "../httpClient/axiosInstance"
import type { ApiResponse } from "../response/apiResponse"
import type { TeacherResponse } from "../response/teacherResponse"

/**
 * Get teacher information by user ID
 * @param userId - The user's ID (UUID)
 * @returns Teacher information including teacherId
 */
export const getTeacherByUserId = async (userId: string): Promise<TeacherResponse> => {
  const response = await axiosInstance.get<ApiResponse<TeacherResponse>>(
    `/identity/teachers/by-user-id/${userId}`
  )
  return response.data.result
}