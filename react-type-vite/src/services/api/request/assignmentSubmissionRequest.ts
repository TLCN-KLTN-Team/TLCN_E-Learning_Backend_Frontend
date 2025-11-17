export interface AssignmentSubmissionRequest {
  assignmentId: number
  idUser?: string // Sẽ lấy từ JWT
  submissionText?: string
  submissionFiles?: string[]
  submissionLink?: string
}
