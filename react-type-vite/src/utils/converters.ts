import type { LessonResponse } from "@/services/api/response/lessonResponse"
import type { LessonRequest } from "@/services/api/request/lessonRequest"
import type { QuizResponse } from "@/services/api/response/quizResponse"
import type { QuizRequest } from "@/services/api/request/quizRequest"
import type { SectionResponse } from "@/services/api/response/sectionResponse"
import type { SectionRequest } from "@/services/api/request/sectionRequest"
import type { QuestionResponse } from "@/services/api/response/questionResponse"
import type { QuestionRequest } from "@/services/api/request/questionRequest"
import type { AnswerResponse } from "@/services/api/response/answerResponse"
import type { AnswerRequest } from "@/services/api/request/answerRequest"
import type { AssignmentResponse } from "@/services/api/response/assignmentResponse"
import type { AssignmentRequest } from "@/services/api/request/assignmentRequest"

const isTemporaryId = (id?: number): boolean => {
  if (!id) return false
  // Temporary IDs are created with Date.now() which are typically > 1000000000000
  // Real IDs from backend are much smaller
  return id > 1000000000000
}

/**
 * Convert AnswerResponse (from backend) to AnswerRequest (for backend)
 * Removes fields like createdAt, updateAt that shouldn't be sent back
 * Don't send ID if it's a temporary ID (for new answers)
 */
export const convertAnswerResponseToRequest = (answer: AnswerResponse): AnswerRequest => {
  return {
    ...(answer.id && !isTemporaryId(answer.id) && { id: answer.id }),
    content: answer.content,
    isCorrect: answer.isCorrect,
    orderIndex: answer.orderIndex,
  }
}

/**
 * Convert QuestionResponse (from backend) to QuestionRequest (for backend)
 * Converts Set<AnswerResponse> to AnswerRequest[] and removes unnecessary fields
 * Don't send ID if it's a temporary ID (for new questions)
 */
export const convertQuestionResponseToRequest = (question: QuestionResponse): QuestionRequest => {
  const answersArray = question.answers ? Array.from(question.answers).map(convertAnswerResponseToRequest) : []

  return {
    ...(question.id && !isTemporaryId(question.id) && { id: question.id }),
    questionText: question.questionText,
    questionType: question.questionType as "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TRUE_FALSE",
    orderIndex: question.orderIndex,
    attachments: question.attachments,
    score: question.score,
    answers: answersArray,
  }
}

/**
 * Convert array of QuestionResponse to QuestionRequest[]
 */
export const convertQuestionsResponseToRequest = (questions: QuestionResponse[]): QuestionRequest[] => {
  return questions.map(convertQuestionResponseToRequest)
}

/**
 * Convert LessonResponse (from backend) to LessonRequest (for backend)
 * Converts Date objects to ISO strings and maps field names correctly
 * Don't send ID if it's a temporary ID (for new lessons)
 */
export const convertLessonResponseToRequest = (lesson: LessonResponse): LessonRequest => {
  return {
    ...(lesson.id && !isTemporaryId(lesson.id) && { id: lesson.id }),
    title: lesson.title,
    description: lesson.description,
    content: lesson.content,
    attachments: lesson.attachments,
    videoUrl: lesson.videoUrl,
    numberItem: lesson.numberItem,
    isFreeLesson: lesson.isFreeLesson,
    isPublished: lesson.isPublished,
    createdAt: lesson.createdAt instanceof Date ? lesson.createdAt.toISOString() : lesson.createdAt,
    updateAt: lesson.updateAt instanceof Date ? lesson.updateAt.toISOString() : lesson.updateAt,
  }
}

/**
 * Convert QuizResponse (from backend) to QuizRequest (for backend)
 * For many-to-many relationship: extract question IDs instead of full question data
 * Don't send ID if it's a temporary ID (for new quizzes)
 */
export const convertQuizResponseToRequest = (quiz: QuizResponse): QuizRequest => {
  // Extract question IDs for many-to-many relationship
  const questionIds = quiz.questions 
    ? Array.from(quiz.questions)
        .filter((q) => q != null && q.id && !isTemporaryId(q.id)) // Filter out null/undefined questions
        .map(q => q!.id!)
    : []

  return {
    ...(quiz.id && !isTemporaryId(quiz.id) && { id: quiz.id }),
    title: quiz.title,
    description: quiz.description,
    duration: quiz.duration,
    attemptLimit: quiz.attemptLimit,
    passingScore: quiz.passingScore,
    numberItem: quiz.numberItem,
    showResults: quiz.showResults,
    isPublished: quiz.isPublished,
    startTime: quiz.startTime
  ? new Date(quiz.startTime).toISOString()
  : undefined,

endTime: quiz.endTime
  ? new Date(quiz.endTime).toISOString()
  : undefined,
    questionIds, // Send question IDs for many-to-many relationship
    createdAt: quiz.createdAt instanceof Date ? quiz.createdAt.toISOString() : quiz.createdAt,
    updateAt: quiz.updateAt instanceof Date ? quiz.updateAt.toISOString() : quiz.updateAt,
  }
}

/**
 * Convert array of LessonResponse to LessonRequest[]
 */
export const convertLessonsResponseToRequest = (lessons: LessonResponse[]): LessonRequest[] => {
  return lessons.map(convertLessonResponseToRequest)
}

/**
 * Convert array of QuizResponse to QuizRequest[]
 */
export const convertQuizzesResponseToRequest = (quizzes: QuizResponse[]): QuizRequest[] => {
  return quizzes.map(convertQuizResponseToRequest)
}

export const convertAssignmentResponseToRequest = (assignment: AssignmentResponse): AssignmentRequest => {
  return {
    ...(assignment.id && !isTemporaryId(assignment.id) && { id: assignment.id }),
    // Don't include sectionId - backend will infer it from nested structure (same as lessons and quizzes)
    // sectionId: assignment.sectionId,
    title: assignment.title,
    description: assignment.description,
    deadline: assignment.deadline instanceof Date ? assignment.deadline : new Date(assignment.deadline),
    assignmentFiles: assignment.assignmentFiles,
    submissionType: assignment.submissionType,
    rubricFiles: assignment.rubricFiles,
    maxScore: assignment.maxScore,
    numberItem: assignment.numberItem,
    isPublished: assignment.isPublished,
    createdAt: assignment.createdAt instanceof Date ? assignment.createdAt : new Date(assignment.createdAt),
    updateAt: assignment.updateAt instanceof Date ? assignment.updateAt : new Date(assignment.updateAt),
  }
}

export const convertAssignmentsResponseToRequest = (assignments: AssignmentResponse[]): AssignmentRequest[] => {
  return assignments.map(convertAssignmentResponseToRequest)
}

/**
 * Convert SectionResponse (from backend) to SectionRequest (for backend)
 * Converts Sets to Arrays, Date objects to ISO strings
 * Maps 'quizs' to 'quizzes' field name
 * Don't send ID if it's a temporary ID (for new sections)
 */
export const convertSectionResponseToRequest = (section: SectionResponse): SectionRequest => {
  const lessonsArray = section.lessons ? Array.from(section.lessons) : []
  const quizzesArray = section.quizs ? Array.from(section.quizs) : []
  const assignmentsArray = section.assignments ? Array.from(section.assignments) : []

  return {
    ...(section.id && !isTemporaryId(section.id) && { id: section.id }),
    title: section.title,
    description: section.description,
    orderIndex: section.orderIndex,
    isPublished: section.isPublished,
    lessons: convertLessonsResponseToRequest(lessonsArray),
    quizzes: convertQuizzesResponseToRequest(quizzesArray),
    assignments: convertAssignmentsResponseToRequest(assignmentsArray),
  }
}
