import axiosInstance from "../httpClient/axiosInstance"
import type { GradeAssignmentRequest } from "../request/gradeAssignmentRequest"
import type { ApiResponse } from "../response/apiResponse"
import type { AssignmentGradingResponse } from "../response/assignmentGradingResponse"
import type { AssignmentSubmissionResponse } from "../response/assignmentSubmissionResponse"
import type { GradingStatisticsResponse } from "../response/gradingStatisticsResponse"

export const getSubmissionsForClass = async (classId: number): Promise<AssignmentGradingResponse[]> => {
  const response = await axiosInstance.get<ApiResponse<AssignmentGradingResponse[]>>(
    `/course-management/teacher/assignments/class/${classId}/submissions`
  )
  console.log("SUBMISSIONS FROM BACKEND:", response.data.result); 
  return response.data.result
}

export const getGradingStatistics = async (classId: number): Promise<GradingStatisticsResponse> => {
  const response = await axiosInstance.get<ApiResponse<GradingStatisticsResponse>>(
    `/course-management/teacher/assignments/class/${classId}/statistics`
  )
  return response.data.result
}

export const gradeSubmission = async (
  submissionId: number,
  request: GradeAssignmentRequest
): Promise<AssignmentSubmissionResponse> => {
  const response = await axiosInstance.post<ApiResponse<AssignmentSubmissionResponse>>(
    `/course-management/teacher/assignments/submissions/${submissionId}/grade`,
    request
  )
  return response.data.result
}