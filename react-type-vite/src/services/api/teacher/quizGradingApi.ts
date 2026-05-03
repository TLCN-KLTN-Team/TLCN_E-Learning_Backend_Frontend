import axiosInstance from "../httpClient/axiosInstance"
import type { ApiResponse } from "../response/apiResponse"
import type { QuizResultResponse } from "../response/quizResultResponse"
import type { QuizStatisticsResponse } from "../response/quizStatisticsResponse"

export const getQuizResultsForClass = async (classId: number): Promise<QuizResultResponse[]> => {
  const response = await axiosInstance.get<ApiResponse<QuizResultResponse[]>>(
    `/course-management/teacher/quizzes/class/${classId}/results`
  )
  console.log("QUIZ RESULTS FROM BACKEND:", response.data.result)
  return response.data.result
}

export const getQuizStatistics = async (classId: number): Promise<QuizStatisticsResponse> => {
  const response = await axiosInstance.get<ApiResponse<QuizStatisticsResponse>>(
    `/course-management/teacher/quizzes/class/${classId}/statistics`
  )
  return response.data.result
}

