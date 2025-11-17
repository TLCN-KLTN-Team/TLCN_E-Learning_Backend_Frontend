import type { AnswerOptionResponse } from "./answerOptionResponse"

export interface QuizAnswerResponse {
  id: number
  questionId: number
  questionText: string
  questionType: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE'
  questionScore: number
  selectedAnswerIds?: number[]
  selectedAnswers?: AnswerOptionResponse[]
  correctAnswerIds?: number[]
  correctAnswers?: AnswerOptionResponse[]
  isCorrect: boolean
  pointsAwarded: number
  answeredAt: string
}