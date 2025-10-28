export interface AssignmentResponse {
  id: number
  sectionId: number
  sectionName: string
  title: string
  description?: string
  deadline: Date
  assignmentFiles?: string[]
  submissionType: "UPLOAD_FILE" | "TEXT" | "LINK" | "BOTH"
  rubricFiles?: string[]
  maxScore?: number
  numberItem: number
  isPublished: boolean
  createdAt: Date
  updateAt: Date
  submissionsCount?: number
}
