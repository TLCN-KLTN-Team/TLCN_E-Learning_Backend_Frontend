export interface AssignmentSubmissionResponse {
  id: number
  assignmentId: number
  assignmentTitle: string
  assignmentDescription?: string
  maxScore?: number
  deadline?: string
  idUser: string
  userName?: string
  studentName?: string
  email?: string
  submissionText?: string
  submissionFiles?: string[]
  submissionLink?: string
  submittedAt: string
  score?: number
  feedback?: string
  gradedAt?: string
  status: 'DRAFT' | 'SUBMITTED' | 'LATE' | 'GRADED'
  isLate?: boolean
  hoursLate?: number
}