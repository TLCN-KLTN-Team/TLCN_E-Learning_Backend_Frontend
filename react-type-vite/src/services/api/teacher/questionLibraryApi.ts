import axiosInstance from "../httpClient/axiosInstance"
import type { ApiResponse } from "../response/apiResponse"

export interface QuestionLibraryResponse {
  id: number
  questionText: string
  questionType: string
  score?: number
  difficultyLevel?: string
  tags?: string
  teacherId: string
  educationalUnitId?: number
  cloId?: number
  cloCode?: string
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
  cloId: number
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

export const deleteLibraryQuestion = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/course-management/teacher/questions/${id}`)
}

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

