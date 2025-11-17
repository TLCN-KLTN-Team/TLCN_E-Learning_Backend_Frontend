export interface QuizAttemptHistoryResponse {
  attemptNumber: number
  score: number
  totalScore: number
  isPassed: boolean
  submittedAt: Date
  timeSpent: number
}