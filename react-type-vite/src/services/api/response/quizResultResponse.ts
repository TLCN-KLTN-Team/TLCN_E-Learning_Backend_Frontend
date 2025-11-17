import type { QuizAnswerResponse } from "./quizAnswerResponse"

export interface QuizResultResponse {
  id: number
  studentId: string
  studentName: string
  email: string
  quizId: number
  quizTitle: string
  quizDescription?: string
  score: number
  totalScore: number
  percentage: number
  isPassed: boolean
  attemptNumber: number
  startedAt: string
  submittedAt: string
  timeSpent: number // in seconds
  answers: QuizAnswerResponse[]
}