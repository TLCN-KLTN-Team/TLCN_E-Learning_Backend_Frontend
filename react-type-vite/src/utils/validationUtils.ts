/**
 * Validation utilities for course builder
 */

export interface ValidationError {
  field: string
  message: string
}

export const validateSection = (data: any): ValidationError[] => {
  const errors: ValidationError[] = []

  if (!data.title || !data.title.trim()) {
    errors.push({ field: "title", message: "Section title is required" })
  } else if (data.title.trim().length < 3) {
    errors.push({ field: "title", message: "Section title must be at least 3 characters" })
  } else if (data.title.trim().length > 200) {
    errors.push({ field: "title", message: "Section title must not exceed 200 characters" })
  }

  if (data.description && data.description.length > 1000) {
    errors.push({ field: "description", message: "Description must not exceed 1000 characters" })
  }

  return errors
}

export const validateLesson = (data: any): ValidationError[] => {
  const errors: ValidationError[] = []

  if (!data.title || !data.title.trim()) {
    errors.push({ field: "title", message: "Lesson title is required" })
  } else if (data.title.trim().length < 3) {
    errors.push({ field: "title", message: "Lesson title must be at least 3 characters" })
  } else if (data.title.trim().length > 200) {
    errors.push({ field: "title", message: "Lesson title must not exceed 200 characters" })
  }

  if (data.description && data.description.length > 1000) {
    errors.push({ field: "description", message: "Description must not exceed 1000 characters" })
  }

  if (data.videoUrl && !isValidUrl(data.videoUrl)) {
    errors.push({ field: "videoUrl", message: "Invalid video URL" })
  }

  return errors
}

export const validateQuiz = (data: any): ValidationError[] => {
  const errors: ValidationError[] = []

  if (!data.title || !data.title.trim()) {
    errors.push({ field: "title", message: "Quiz title is required" })
  } else if (data.title.trim().length < 3) {
    errors.push({ field: "title", message: "Quiz title must be at least 3 characters" })
  } else if (data.title.trim().length > 200) {
    errors.push({ field: "title", message: "Quiz title must not exceed 200 characters" })
  }

  if (!data.questions || data.questions.length === 0) {
    errors.push({ field: "questions", message: "Quiz must have at least one question" })
  } else {
    data.questions.forEach((q: any, index: number) => {
      const questionErrors = validateQuestion(q)
      if (questionErrors.length > 0) {
        errors.push({
          field: `questions[${index}]`,
          message: questionErrors.map((e) => e.message).join(", "),
        })
      }
    })
  }

  if (data.duration && data.duration < 1) {
    errors.push({ field: "duration", message: "Duration must be at least 1 minute" })
  }

  if (data.passingScore && (data.passingScore < 0 || data.passingScore > 100)) {
    errors.push({ field: "passingScore", message: "Passing score must be between 0 and 100" })
  }

  if (data.attemptLimit && data.attemptLimit < 1) {
    errors.push({ field: "attemptLimit", message: "Attempt limit must be at least 1" })
  }

  return errors
}

export const validateAssignment = (data: any): ValidationError[] => {
  const errors: ValidationError[] = []

  if (!data.title || !data.title.trim()) {
    errors.push({ field: "title", message: "Assignment title is required" })
  } else if (data.title.trim().length < 3) {
    errors.push({ field: "title", message: "Assignment title must be at least 3 characters" })
  } else if (data.title.trim().length > 200) {
    errors.push({ field: "title", message: "Assignment title must not exceed 200 characters" })
  }

  if (!data.deadline) {
    errors.push({ field: "deadline", message: "Deadline is required" })
  } else {
    const deadline = new Date(data.deadline)
    const now = new Date()
    if (deadline <= now) {
      errors.push({ field: "deadline", message: "Deadline must be in the future" })
    }
  }

  if (!data.submissionType || !data.submissionType.trim()) {
    errors.push({ field: "submissionType", message: "Submission type is required" })
  }

  if (data.description && data.description.length > 1000) {
    errors.push({ field: "description", message: "Description must not exceed 1000 characters" })
  }

  if (data.maxScore && data.maxScore < 0) {
    errors.push({ field: "maxScore", message: "Max score must be a positive number" })
  }

  return errors
}

export const validateQuestion = (data: any): ValidationError[] => {
  const errors: ValidationError[] = []

  if (!data.questionText || !data.questionText.trim()) {
    errors.push({ field: "questionText", message: "Question text is required" })
  } else if (data.questionText.trim().length < 3) {
    errors.push({ field: "questionText", message: "Question text must be at least 3 characters" })
  }

  if (!data.questionType) {
    errors.push({ field: "questionType", message: "Question type is required" })
  }

  if (!data.answers || data.answers.length === 0) {
    errors.push({ field: "answers", message: "Question must have at least one answer" })
  } else {
    const hasCorrectAnswer = data.answers.some((a: any) => a.isCorrect)
    if (!hasCorrectAnswer) {
      errors.push({ field: "answers", message: "Question must have at least one correct answer" })
    }

    data.answers.forEach((a: any, index: number) => {
      if (!a.content || !a.content.trim()) {
        errors.push({ field: `answers[${index}]`, message: "Answer content is required" })
      }
    })
  }

  if (data.score && data.score < 0) {
    errors.push({ field: "score", message: "Score must be a positive number" })
  }

  return errors
}

export const validateAnswer = (data: any): ValidationError[] => {
  const errors: ValidationError[] = []

  if (!data.content || !data.content.trim()) {
    errors.push({ field: "content", message: "Answer content is required" })
  } else if (data.content.trim().length < 1) {
    errors.push({ field: "content", message: "Answer content must not be empty" })
  } else if (data.content.trim().length > 500) {
    errors.push({ field: "content", message: "Answer content must not exceed 500 characters" })
  }

  return errors
}

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export const formatValidationErrors = (errors: ValidationError[]): string => {
  return errors.map((e) => `${e.field}: ${e.message}`).join("\n")
}
