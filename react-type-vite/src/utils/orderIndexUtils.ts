/**
 * Utility functions for calculating order indices on the frontend
 * The backend will no longer auto-generate order indices
 * Frontend is responsible for calculating and sending the next order index
 *
 * All indices now start from 1 for consistency
 */

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

/**
 * Get the next order index for a question
 * Now starts from 1 instead of 0
 * @param questions - Array of existing questions
 * @returns Next order index (max + 1, or 1 if empty)
 */
export const getNextQuestionOrderIndex = (questions: any[]): number => {
  if (!questions || questions.length === 0) {
    return 1
  }
  const maxIndex = Math.max(...questions.map((q) => q.orderIndex || 0))
  return maxIndex + 1
}

/**
 * Get the next order index for an answer
 * Now starts from 1 instead of 0
 * @param answers - Array of existing answers
 * @returns Next order index (max + 1, or 1 if empty)
 */
export const getNextAnswerOrderIndex = (answers: any[]): number => {
  if (!answers || answers.length === 0) {
    return 1
  }
  const maxIndex = Math.max(...answers.map((a) => a.orderIndex || 0))
  return maxIndex + 1
}

/**
 * Recalculate order indices for an array of items after reordering
 * Now starts from 1 instead of 0
 * @param items - Array of items to reorder
 * @param indexField - Field name for the index (e.g., 'orderIndex', 'numberItem')
 * @returns Array with updated indices
 */
export const recalculateOrderIndices = <T extends Record<string, any>>(
  items: T[],
  indexField: "orderIndex" | "numberItem" = "orderIndex",
): T[] => {
  return items.map((item, index) => ({
    ...item,
    [indexField]: index + 1,
  }))
}
