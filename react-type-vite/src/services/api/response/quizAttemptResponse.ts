import type { QuizAttemptAnswerResponse } from "./quizAttemptAnswerResponse"

export interface QuizAttemptResponse {
  id: number
  userId: string
  quizId: number
  score: number
  totalScore: number
  isPassed: boolean
  startedAt: Date
  submittedAt: Date
  timeSpent: number
  answers: QuizAttemptAnswerResponse[]
}