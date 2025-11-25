export interface AssignmentRequest {
  id?: number
  sectionId?: number // Optional - backend infers from nested structure like lessons and quizzes
  title: string
  description?: string
  deadline: Date
  assignmentFiles?: string[]
  submissionType: "UPLOAD_FILE" | "TEXT" | "LINK" | "BOTH"
  rubricFiles?: string[]
  maxScore?: number
  numberItem?: number
  isPublished?: boolean
  createdAt?: Date
  updateAt?: Date
}
