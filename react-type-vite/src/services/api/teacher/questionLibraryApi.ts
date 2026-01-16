import axiosInstance from "../httpClient/axiosInstance"
import type { ApiResponse } from "../response/apiResponse"

// ===========================
// Types
// ===========================

export interface QuestionLibraryResponse {
  id: number
  questionText: string
  questionType: string // MULTIPLE_CHOICE, TRUE_FALSE, SHORT_ANSWER, ESSAY
  score?: number
  difficultyLevel?: string // EASY, MEDIUM, HARD
  tags?: string
  teacherId: string
  educationalUnitId?: number
  attachments?: string[]
  answers: AnswerResponse[]
}

export interface AnswerResponse {
  id: number
  content: string
  isCorrect: boolean
}

export interface QuestionLibraryRequest {
  questionText: string
  questionType: string
  score?: number
  difficultyLevel?: string
  tags?: string
  educationalUnitId?: number
  attachments?: string[]
  answers: AnswerRequest[]
}

export interface AnswerRequest {
  content: string
  isCorrect: boolean
  orderIndex?: number
}

export interface QuestionLibraryListResponse {
  questions: QuestionLibraryResponse[]
  currentPage: number
  totalItems: number
  totalPages: number
}

// ===========================
// API Functions
// ===========================

/**
 * Get paginated list of library questions with optional filters
 */
export const getLibraryQuestions = async (params: {
  page?: number
  size?: number
  search?: string
  questionType?: string
  difficultyLevel?: string
  tags?: string
  sortBy?: string
  sortDirection?: string
}): Promise<QuestionLibraryListResponse> => {
  const response = await axiosInstance.get<ApiResponse<QuestionLibraryListResponse>>(
    `/course-management/teacher/questions`,
    { params }
  )
  return response.data.result
}

/**
 * Get a single library question by ID
 */
export const getLibraryQuestionById = async (
  id: number
): Promise<QuestionLibraryResponse> => {
  const response = await axiosInstance.get<ApiResponse<QuestionLibraryResponse>>(
    `/course-management/teacher/questions/${id}`
  )
  return response.data.result
}

/**
 * Create a new library question
 */
export const createLibraryQuestion = async (
  request: QuestionLibraryRequest,
  imageFiles?: File[]
): Promise<QuestionLibraryResponse> => {
  const formData = new FormData()
  
  // Append question data as JSON
  formData.append('request', new Blob([JSON.stringify(request)], { type: 'application/json' }))
  
  // Append image files
  if (imageFiles && imageFiles.length > 0) {
    imageFiles.forEach(file => {
      formData.append('imageFiles', file)
    })
  }
  
  const response = await axiosInstance.post<ApiResponse<QuestionLibraryResponse>>(
    `/course-management/teacher/questions`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }
  )
  return response.data.result
}

/**
 * Update an existing library question
 */
export const updateLibraryQuestion = async (
  id: number,
  request: QuestionLibraryRequest,
  imageFiles?: File[]
): Promise<QuestionLibraryResponse> => {
  const formData = new FormData()
  
  // Append question data as JSON
  formData.append('request', new Blob([JSON.stringify(request)], { type: 'application/json' }))
  
  // Append image files
  if (imageFiles && imageFiles.length > 0) {
    imageFiles.forEach(file => {
      formData.append('imageFiles', file)
    })
  }
  
  const response = await axiosInstance.put<ApiResponse<QuestionLibraryResponse>>(
    `/course-management/teacher/questions/${id}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }
  )
  return response.data.result
}

/**
 * Delete a library question
 */
export const deleteLibraryQuestion = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/course-management/teacher/questions/${id}`)
}

/**
 * Get count of library questions for current teacher
 */
export const getLibraryQuestionsCount = async (): Promise<number> => {
  const response = await axiosInstance.get<ApiResponse<{ count: number }>>(
    `/course-management/teacher/questions/count`
  )
  return response.data.result.count
}

/**
 * Get multiple library questions by IDs (for adding to quiz)
 */
export const getLibraryQuestionsByIds = async (
  questionIds: number[]
): Promise<QuestionLibraryResponse[]> => {
  const response = await axiosInstance.post<ApiResponse<QuestionLibraryResponse[]>>(
    `/course-management/teacher/questions/batch`,
    questionIds
  )
  return response.data.result
}

/**
 * Add library questions to a quiz
 */
export const addLibraryQuestionsToQuiz = async (
  quizId: number,
  libraryQuestionIds: number[]
): Promise<{ addedCount: number; message: string }> => {
  const response = await axiosInstance.post<
    ApiResponse<{ addedCount: number; message: string }>
  >(`/course-management/teacher/quizzes/${quizId}/add-library-questions`, libraryQuestionIds)
  return response.data.result
}

/**
 * Import questions from Excel file (.xlsx)
 */
export const importQuestionsFromCsv = async (file: File): Promise<{
  successCount: number
  errorCount: number
  errors: string[]
  importedQuestions: QuestionLibraryResponse[]
}> => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await axiosInstance.post<ApiResponse<{
    successCount: number
    errorCount: number
    errors: string[]
    importedQuestions: QuestionLibraryResponse[]
  }>>(`/course-management/teacher/questions/import`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data.result
}

