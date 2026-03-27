import axiosInstance from "../httpClient/axiosInstance"
import type { ApiResponse } from "../response/apiResponse"

export interface QuizBlueprintItem {
  id: number
  quizId: number
  cloId: number
  cloCode: string
  cloDescription?: string
  percentage: number
}

export interface QuizBlueprintRequest {
  cloId: number
  percentage: number
}

export const getQuizBlueprint = async (quizId: number): Promise<QuizBlueprintItem[]> => {
  const response = await axiosInstance.get<ApiResponse<QuizBlueprintItem[]>>(
    `/course-management/teacher/quizzes/${quizId}/blueprint`
  )
  return response.data.result
}

export const addBlueprintEntry = async (
  quizId: number,
  payload: QuizBlueprintRequest
): Promise<QuizBlueprintItem> => {
  const response = await axiosInstance.post<ApiResponse<QuizBlueprintItem>>(
    `/course-management/teacher/quizzes/${quizId}/blueprint`,
    payload
  )
  return response.data.result
}

export const updateBlueprintEntry = async (
  quizId: number,
  cloId: number,
  payload: QuizBlueprintRequest
): Promise<QuizBlueprintItem> => {
  const response = await axiosInstance.put<ApiResponse<QuizBlueprintItem>>(
    `/course-management/teacher/quizzes/${quizId}/blueprint/${cloId}`,
    payload
  )
  return response.data.result
}

export const removeBlueprintEntry = async (quizId: number, cloId: number): Promise<void> => {
  await axiosInstance.delete(`/course-management/teacher/quizzes/${quizId}/blueprint/${cloId}`)
}

export const validateBlueprint = async (quizId: number): Promise<{ valid: boolean; message: string }> => {
  const response = await axiosInstance.post<ApiResponse<{ valid: boolean; message: string }>>(
    `/course-management/teacher/quizzes/${quizId}/blueprint/validate`
  )
  return response.data.result
}
