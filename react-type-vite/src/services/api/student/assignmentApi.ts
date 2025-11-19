
import axiosInstance from "../httpClient/axiosInstance"
import type { AssignmentSubmissionRequest } from "../request/assignmentSubmissionRequest"
import type { ApiResponse } from "../response/apiResponse"
import type { AssignmentDetailResponse } from "../response/assignmentDetailResponse"
import type { AssignmentSubmissionResponse } from "../response/assignmentSubmissionResponse"

const ASSIGNMENT_API_BASE = "/course-management/student/assignments"

export const assignmentApi = {
  // Get assignment detail with user's submission
  getAssignmentDetail: async (assignmentId: number): Promise<AssignmentDetailResponse> => {
    const response = await axiosInstance.get<ApiResponse<AssignmentDetailResponse>>(
      `${ASSIGNMENT_API_BASE}/${assignmentId}`
    )
    return response.data.result
  },

  // Get my submission for an assignment
  getMySubmission: async (assignmentId: number): Promise<AssignmentSubmissionResponse | null> => {
    try {
      const response = await axiosInstance.get<ApiResponse<AssignmentSubmissionResponse>>(
        `${ASSIGNMENT_API_BASE}/${assignmentId}/my-submission`
      )
      return response.data.result
    } catch (error) {
      // If no submission found, return null
      return null
    }
  },

  // Submit assignment
  submitAssignment: async (
    assignmentId: number,
    data: AssignmentSubmissionRequest,
    files?: File[]
  ): Promise<AssignmentSubmissionResponse> => {
    const formData = new FormData()
    
    if (data.submissionText) {
      formData.append('submissionText', data.submissionText)
    }
    
    if (data.submissionLink) {
      formData.append('submissionLink', data.submissionLink)
    }
    
    if (files && files.length > 0) {
      files.forEach(file => {
        formData.append('submissionFiles', file)
      })
    }

    const response = await axiosInstance.post<ApiResponse<AssignmentSubmissionResponse>>(
      `${ASSIGNMENT_API_BASE}/${assignmentId}/submit`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data.result
  },

  // Update submission (nếu chưa quá hạn)
  updateSubmission: async (
    submissionId: number,
    data: AssignmentSubmissionRequest,
    files?: File[],
    existingFiles?: string[]
  ): Promise<AssignmentSubmissionResponse> => {
    const formData = new FormData()
    
    if (data.submissionText) {
      formData.append('submissionText', data.submissionText)
    }
    
    if (data.submissionLink) {
      formData.append('submissionLink', data.submissionLink)
    }
    
    if (files && files.length > 0) {
      files.forEach(file => {
        formData.append('submissionFiles', file)
      })
    }
    
    if (existingFiles && existingFiles.length > 0) {
      formData.append('existingFiles', JSON.stringify(existingFiles))
    }

    const response = await axiosInstance.put<ApiResponse<AssignmentSubmissionResponse>>(
      `${ASSIGNMENT_API_BASE}/submissions/${submissionId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data.result
  },

  // Delete submission (nếu chưa quá hạn)
  deleteSubmission: async (submissionId: number): Promise<void> => {
    await axiosInstance.delete(`${ASSIGNMENT_API_BASE}/submissions/${submissionId}`)
  }
}

export default assignmentApi