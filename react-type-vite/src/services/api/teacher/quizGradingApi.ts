import axiosInstance from "../httpClient/axiosInstance"
import type { ApiResponse } from "../response/apiResponse"
import type { QuizResultResponse } from "../response/quizResultResponse"
import type { QuizStatisticsResponse } from "../response/quizStatisticsResponse"

/**
 * Get all quiz results for a class
 */
export const getQuizResultsForClass = async (classId: number): Promise<QuizResultResponse[]> => {
  const response = await axiosInstance.get<ApiResponse<QuizResultResponse[]>>(
    `/course-management/teacher/quizzes/class/${classId}/results`
  )
  console.log("QUIZ RESULTS FROM BACKEND:", response.data.result)
  return response.data.result
}

/**
 * Get quiz results for a specific quiz
 */
export const getResultsByQuiz = async (
  quizId: number,
  classId: number
): Promise<QuizResultResponse[]> => {
  const response = await axiosInstance.get<ApiResponse<QuizResultResponse[]>>(
    `/course-management/teacher/quizzes/${quizId}/class/${classId}/results`
  )
  return response.data.result
}

/**
 * Get quiz statistics for a class
 */
export const getQuizStatistics = async (classId: number): Promise<QuizStatisticsResponse> => {
  const response = await axiosInstance.get<ApiResponse<QuizStatisticsResponse>>(
    `/course-management/teacher/quizzes/class/${classId}/statistics`
  )
  return response.data.result
}

/**
 * Get detailed result for a specific attempt
 */
export const getAttemptDetail = async (attemptId: number): Promise<QuizResultResponse> => {
  const response = await axiosInstance.get<ApiResponse<QuizResultResponse>>(
    `/course-management/teacher/quizzes/attempts/${attemptId}`
  )
  return response.data.result
}