export interface StudentEnrollmentRequest {
  studentId: string
  courseId: number
  classId?: number
}

export interface BulkEnrollStudentsRequest {
  courseId: number
  classId?: number
  studentIds: string[]
}
