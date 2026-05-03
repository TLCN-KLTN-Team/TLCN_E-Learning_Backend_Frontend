/**
 * Get the next order index for a section
 * @param sections - Array of existing sections
 * @returns Next order index (max + 1, or 1 if empty)
 */
export const getNextSectionOrderIndex = (sections: any[]): number => {
  if (!sections || sections.length === 0) {
    return 1
  }
  const maxIndex = Math.max(...sections.map((s) => s.orderIndex || 0))
  return maxIndex + 1
}

/**
 * Get the next number item (order index) for a lesson
 * Now starts from 1 instead of 0
 * @param lessons - Array of existing lessons
 * @returns Next number item (max + 1, or 1 if empty)
 */
export const getNextLessonNumberItem = (lessons: any[]): number => {
  if (!lessons || lessons.length === 0) {
    return 1
  }
  const maxIndex = Math.max(...lessons.map((l) => l.numberItem || 0))
  return maxIndex + 1
}

/**
 * Get the next number item (order index) for a quiz
 * Now starts from 1 instead of 0
 * @param quizzes - Array of existing quizzes
 * @returns Next number item (max + 1, or 1 if empty)
 */
export const getNextQuizNumberItem = (quizzes: any[]): number => {
  if (!quizzes || quizzes.length === 0) {
    return 1
  }
  const maxIndex = Math.max(...quizzes.map((q) => q.numberItem || 0))
  return maxIndex + 1
}

/**
 * Get the next number item (order index) for an assignment
 * Now starts from 1 instead of 0
 * @param assignments - Array of existing assignments
 * @returns Next number item (max + 1, or 1 if empty)
 */
export const getNextAssignmentNumberItem = (assignments: any[]): number => {
  if (!assignments || assignments.length === 0) {
    return 1
  }
  const maxIndex = Math.max(...assignments.map((a) => a.numberItem || 0))
  return maxIndex + 1
}
