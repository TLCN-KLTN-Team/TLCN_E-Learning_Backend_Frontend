interface AnswerResponse {
  id: number
  content: string
  isCorrect: boolean
  orderIndex: number
  createdAt: Date
  updateAt: Date
}

export type { AnswerResponse };