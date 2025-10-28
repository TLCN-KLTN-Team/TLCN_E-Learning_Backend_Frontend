import type { QuestionResponse } from "./questionResponse"

interface QuizResponse {
  id: number
  sectionId: number
  sectionName: string
  title: string
  description: string
  duration: number
  attemptLimit: number
  passingScore: number
  numberItem: number
  showResults: boolean
  isPublished: boolean
  startTime?: Date
  endTime?: Date
  questions: Set<QuestionResponse>
  attemptsCount: number
  createdAt: Date
  updateAt: Date
}

export type { QuizResponse };