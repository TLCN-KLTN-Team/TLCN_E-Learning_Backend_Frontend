import axiosInstance from "../httpClient/axiosInstance"
import type { GradeAssignmentRequest } from "../request/gradeAssignmentRequest"
import type { ApiResponse } from "../response/apiResponse"
import type { AssignmentGradingResponse } from "../response/assignmentGradingResponse"
import type { AssignmentSubmissionResponse } from "../response/assignmentSubmissionResponse"
import type { GradingStatisticsResponse } from "../response/gradingStatisticsResponse"

/**
 * Get all submissions for grading in a class
 */
export const getSubmissionsForClass = async (classId: number): Promise<AssignmentGradingResponse[]> => {
  const response = await axiosInstance.get<ApiResponse<AssignmentGradingResponse[]>>(
    `/course-management/teacher/assignments/class/${classId}/submissions`
  )
  console.log("SUBMISSIONS FROM BACKEND:", response.data.result); 
  return response.data.result
}

/**
 * Get submissions for a specific assignment
 */
export const getSubmissionsByAssignment = async (
  assignmentId: number,
  classId: number
): Promise<AssignmentSubmissionResponse[]> => {
  const response = await axiosInstance.get<ApiResponse<AssignmentSubmissionResponse[]>>(
    `/course-management/teacher/assignments/${assignmentId}/class/${classId}/submissions`
  )
  return response.data.result
}

/**
 * Get grading statistics for a class
 */
export const getGradingStatistics = async (classId: number): Promise<GradingStatisticsResponse> => {
  const response = await axiosInstance.get<ApiResponse<GradingStatisticsResponse>>(
    `/course-management/teacher/assignments/class/${classId}/statistics`
  )
  return response.data.result
}

/**
 * Grade a submission
 */
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

/**
 * Bulk grade multiple submissions
 */
export const bulkGradeSubmissions = async (
  requests: GradeAssignmentRequest[]
): Promise<AssignmentSubmissionResponse[]> => {
  const response = await axiosInstance.post<ApiResponse<AssignmentSubmissionResponse[]>>(
    `/course-management/teacher/assignments/submissions/bulk-grade`,
    requests
  )
  return response.data.result
}

/**
 * Get submission detail
 */
export const getSubmissionDetail = async (submissionId: number): Promise<AssignmentSubmissionResponse> => {
  const response = await axiosInstance.get<ApiResponse<AssignmentSubmissionResponse>>(
    `/course-management/teacher/assignments/submissions/${submissionId}`
  )
  return response.data.result
}