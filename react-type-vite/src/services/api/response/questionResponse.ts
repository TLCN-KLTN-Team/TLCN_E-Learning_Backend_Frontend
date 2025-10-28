import type { AnswerResponse } from "./answerResponse"

interface QuestionResponse {
  id: number
  questionText: string
  questionType: string
  orderIndex: number
  attachments: string[]
  score: number
  createdAt: Date
  updateAt: Date
  answers: Set<AnswerResponse>
}

export type { QuestionResponse };