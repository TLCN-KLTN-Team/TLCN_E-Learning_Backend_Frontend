export interface StudentEnrollmentResponse {
  id: number
  studentId: string
  studentName: string
  email: string
  mssv: string
  submittedAssignments: number
  totalAssignments: number
  completedQuizzes: number
  totalQuizzes: number
  averageScore: number
  lastAccessTime?: Date
  totalLearningHours: number
  enrollmentDate?: Date
  status: "active" | "inactive" | "completed"
}

export interface ClassStudentStatsResponse {
  totalStudents: number
  activeStudents: number
  averageScore: number
  completionRate: number
}
