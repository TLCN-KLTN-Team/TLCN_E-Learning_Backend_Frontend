import type { AssignmentSubmissionResponse } from "./assignmentSubmissionResponse"

export interface AssignmentGradingResponse {
  studentId: string
  studentName: string
  email: string
  totalAssignments: number
  submittedAssignments: number
  gradedAssignments: number
  pendingAssignments: number
  averageScore: number
  latestSubmissions: AssignmentSubmissionResponse[]
}