export interface GradeAssignmentRequest {
  submissionId: number
  score: number
  feedback?: string
}