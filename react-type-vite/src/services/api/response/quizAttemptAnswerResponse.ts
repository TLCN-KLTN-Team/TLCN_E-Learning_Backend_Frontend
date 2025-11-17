export interface QuizAttemptAnswerResponse {
  id: number
  questionId: number
  selectedAnswerId?: number
  selectedAnswerIds?: number[]
  answerText?: string
  isCorrect: boolean
  pointsAwarded: number
  answeredAt: Date
}