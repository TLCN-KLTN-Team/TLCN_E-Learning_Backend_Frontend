import axiosInstance from "../httpClient/axiosInstance"

export interface PublicCourseResponse {
  id: number
  publishedCourseId?: number
  courseName: string
  description?: string
  credits?: number
  maxStudents?: number
  currentStudents?: number
  price: number
  createdAt?: string
  updatedAt?: string
}

export interface PublicCourseStudent {
  studentId: string
  studentName: string
  email: string
  enrolledDate: string
  progress: number
  quizzesTaken: number
  assignmentsSubmitted: number
  lessonsCompleted: number
  publishedLessons: number
  publishedQuizzes: number
  publishedAssignments: number
  avatarUrl?: string
}

export interface StudentQuizAttempt {
  attemptId: number
  quizId: number
  quizTitle: string
  studentName?: string
  attemptDate: string
  duration: number
  score: number
  maxScore: number
  passed: boolean
  questionsCorrect: number
  totalQuestions: number
}

export interface QuizAttemptQuestionDetail {
  questionId: number
  questionText: string
  questionType: string
  options: string[]
  correctAnswers: number[]
  studentAnswers: number[]
  isCorrect: boolean
  points: number
}

export interface QuizAttemptDetail {
  attemptId: number
  quizTitle: string
  studentName: string
  score: number
  maxScore: number
  passed: boolean
  duration: number
  questions: QuizAttemptQuestionDetail[]
}

export interface StudentAssignmentSubmission {
  submissionId: number
  assignmentId: number
  assignmentTitle: string
  studentName?: string
  submittedDate: string
  deadline: string
  content: string
  files: string[]
  link: string
  score: number | null
  maxScore: number
  feedback: string
  status: "pending" | "graded"
  isLate: boolean
}

export interface GradeAssignmentRequest {
  score: number
  feedback?: string
}

export interface TeacherPublicStatistics {
  totalCourses: number
  totalStudents: number
  totalRevenue: number
  totalQuizAttempts: number
  totalAssignmentsSubmitted: number
  pendingAssignments: number
  averageCourseRating: number
}

const teacherPublicApi = {
  getPublicCourses: async (
    teacherId: string,
    page: number = 0,
    size: number = 20,
    search?: string,
    creditRange?: string,
    updatedRange?: string
  ) => {
    const params: any = { page, size }
    if (search) params.search = search
    if (creditRange) params.creditRange = creditRange
    if (updatedRange) params.updatedRange = updatedRange

    const response = await axiosInstance.get<{ result: { content: PublicCourseResponse[]; totalElements?: number; totalPages?: number } }>(
      `/course-management/teacher/public/courses/${teacherId}`,
      { params }
    )

    return response.data.result
  },

  getCourseStudents: async (courseId: number): Promise<PublicCourseStudent[]> => {
    const response = await axiosInstance.get(`/course-management/teacher/public/courses/${courseId}/students`)
    return response.data.result
  },

  getStudentQuizAttempts: async (
    courseId: number,
    studentId: string
  ): Promise<StudentQuizAttempt[]> => {
    const response = await axiosInstance.get(
      `/course-management/teacher/public/courses/${courseId}/students/${studentId}/quizzes`
    ) 
    return response.data.result
  },

  getQuizAttemptDetails: async (attemptId: number): Promise<QuizAttemptDetail> => {
    const response = await axiosInstance.get(`/course-management/teacher/public/quizzes/attempts/${attemptId}/details`)
    return response.data.result
  },

  getStudentAssignments: async (
    courseId: number,
    studentId: string
  ): Promise<StudentAssignmentSubmission[]> => {
    const response = await axiosInstance.get(
      `/course-management/teacher/public/courses/${courseId}/students/${studentId}/assignments`
    )
    return response.data.result
  },

  gradeAssignment: async (
    submissionId: number,
    data: GradeAssignmentRequest
  ): Promise<StudentAssignmentSubmission> => {
    const response = await axiosInstance.put(
      `/course-management/teacher/public/assignments/submissions/${submissionId}/grade`,
      data
    )
    return response.data.result
  },

  getTeacherStatistics: async (teacherId: string): Promise<TeacherPublicStatistics> => {
    const response = await axiosInstance.get(`/course-management/teacher/public/statistics/${teacherId}`)
    return response.data.result
  }
}

export default teacherPublicApi
