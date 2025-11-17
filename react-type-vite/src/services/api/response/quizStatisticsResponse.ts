export interface QuizStatisticsResponse {
  totalQuizzes: number
  totalAttempts: number
  passedAttempts: number
  failedAttempts: number
  averageScore: number
  averagePercentage: number
  highestScore: number
  lowestScore: number
}