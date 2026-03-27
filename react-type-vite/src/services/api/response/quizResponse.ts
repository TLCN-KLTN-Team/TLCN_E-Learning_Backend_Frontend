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
  startTime?: string;
  endTime?: string;
  questions: Set<QuestionResponse>
  blueprintDraft?: { cloId: number; percentage: number }[]
  attemptsCount: number
  createdAt: Date
  updateAt: Date
}

export type { QuizResponse };