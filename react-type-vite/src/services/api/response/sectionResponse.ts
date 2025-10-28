import type { AssignmentResponse } from "./assignmentResponse"
import type { LessonResponse } from "./lessonResponse"
import type { QuizResponse } from "./quizResponse"

interface SectionResponse {
  id: number
  courseId: number
  courseName: string
  title: string
  description: string
  orderIndex: number
  isPublished: boolean
  createdAt: Date
  updateAt: Date
  lessons: Set<LessonResponse>
  quizs: Set<QuizResponse>
  assignments: Set<AssignmentResponse>
}

export type { SectionResponse };