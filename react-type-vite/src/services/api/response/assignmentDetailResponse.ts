import type { AssignmentResponse } from "./assignmentResponse"
import type { AssignmentSubmissionResponse } from "./assignmentSubmissionResponse"

export interface AssignmentDetailResponse extends AssignmentResponse {
  mySubmission?: AssignmentSubmissionResponse
  canSubmit: boolean
  isLate: boolean
  daysUntilDeadline: number
}