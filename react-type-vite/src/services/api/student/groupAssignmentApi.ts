import axiosInstance from "../httpClient/axiosInstance"
import type { ApiResponse } from "../response/apiResponse"
import type { GroupAssignmentResponse } from "@/types/groupAssignment.types"

const GROUP_ASSIGNMENT_API_BASE = "/course-management/student/group-assignments"

export const groupAssignmentApi = {
  // Lấy bài tập nhóm của sinh viên trong một lớp
  getByClass: async (classId: number): Promise<GroupAssignmentResponse[]> => {
    const response = await axiosInstance.get<ApiResponse<GroupAssignmentResponse[]>>(
      `${GROUP_ASSIGNMENT_API_BASE}/class/${classId}`
    )
    return response.data.result
  },
}

export default groupAssignmentApi
