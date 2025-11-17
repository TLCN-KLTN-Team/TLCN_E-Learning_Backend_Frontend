export interface QuizAttemptRequest {
  quizId: number
  answers: QuizAnswerSubmission[]
  timeSpent: number // in seconds
}

export interface QuizAnswerSubmission {
  questionId: number
  selectedAnswerId?: number // For single choice & true/false
  selectedAnswerIds?: number[] // NEW: For multiple choice
  answerText?: string // For essay questions
}