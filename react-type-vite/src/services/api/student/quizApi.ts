
import axiosInstance from "../httpClient/axiosInstance"
import type { QuizAttemptRequest } from "../request/quizAttemptRequest"
import type { ApiResponse } from "../response/apiResponse"
import type { QuizAttemptHistoryResponse } from "../response/quizAttemptHistoryResponse"
import type { QuizAttemptResponse } from "../response/quizAttemptResponse"
import type { QuizResponse } from "../response/quizResponse"

const QUIZ_API_BASE = "/course-management/student/quizzes"

export const quizApi = {
  getQuizDetail: async (quizId: number): Promise<QuizResponse> => {
    const response = await axiosInstance.get<ApiResponse<QuizResponse>>(
      `${QUIZ_API_BASE}/${quizId}`
    )
    return response.data.result
  },

  getQuizAttemptHistory: async (quizId: number): Promise<QuizAttemptHistoryResponse[]> => {
    const response = await axiosInstance.get<ApiResponse<QuizAttemptHistoryResponse[]>>(
      `${QUIZ_API_BASE}/${quizId}/attempts`
    )
    return response.data.result
  },

  startQuizAttempt: async (quizId: number): Promise<{ attemptId: number }> => {
    const response = await axiosInstance.post<ApiResponse<{ attemptId: number }>>(
      `${QUIZ_API_BASE}/${quizId}/start`
    )
    return response.data.result
  },

  submitQuizAttempt: async (
    quizId: number, 
    data: QuizAttemptRequest
  ): Promise<QuizAttemptResponse> => {
    const response = await axiosInstance.post<ApiResponse<QuizAttemptResponse>>(
      `${QUIZ_API_BASE}/${quizId}/submit`,
      data
    )
    return response.data.result
  },

  getAttemptResult: async (attemptId: number): Promise<QuizAttemptResponse> => {
    const response = await axiosInstance.get<ApiResponse<QuizAttemptResponse>>(
      `${QUIZ_API_BASE}/attempts/${attemptId}`
    )
    return response.data.result
  }
}

export default quizApi