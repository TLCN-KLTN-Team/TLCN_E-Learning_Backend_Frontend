import type { SectionResponse } from "@/services/api/response/sectionResponse"
import type { LessonResponse } from "@/services/api/response/lessonResponse"
import type { QuizResponse } from "@/services/api/response/quizResponse"

/**
 * Create a mapping of temporary IDs to real IDs from API response
 */
export const createIdMapping = (
  oldSections: SectionResponse[],
  newSections: SectionResponse[],
): Map<number, number> => {
  const mapping = new Map<number, number>()

  oldSections.forEach((oldSection) => {
    const newSection = newSections.find((s) => s.title === oldSection.title && s.orderIndex === oldSection.orderIndex)
    if (newSection && oldSection.id !== newSection.id) {
      mapping.set(oldSection.id, newSection.id)
    }
  })

  return mapping
}

/**
 * Update section IDs after API response
 * Added proper type assertions for Set<LessonResponse> and Set<QuizResponse>
 */
export const updateSectionIds = (sections: SectionResponse[], idMapping: Map<number, number>): SectionResponse[] => {
  return sections.map((section) => {
    const newId = idMapping.get(section.id) || section.id

    const updatedLessons: Set<LessonResponse> = section.lessons
      ? new Set(
          Array.from(section.lessons).map((lesson) => ({
            ...lesson,
            sectionId: newId,
          })) as LessonResponse[],
        )
      : new Set<LessonResponse>()

    const updatedQuizzes: Set<QuizResponse> = section.quizs
      ? new Set(
          Array.from(section.quizs).map((quiz) => ({
            ...quiz,
            sectionId: newId,
          })) as QuizResponse[],
        )
      : new Set<QuizResponse>()

    return {
      ...section,
      id: newId,
      lessons: updatedLessons,
      quizs: updatedQuizzes,
    } as SectionResponse
  })
}

/**
 * Merge old sections with new API response, preserving temporary items
 * This handles the case where some items are new (temp IDs) and some are updated
 * Added proper return type assertion
 */
export const mergeWithApiResponse = (
  oldSections: SectionResponse[],
  apiSections: SectionResponse[],
): SectionResponse[] => {
  const merged: SectionResponse[] = []
  const processedApiIds = new Set<number>()

  // First, process all API sections
  apiSections.forEach((apiSection) => {
    processedApiIds.add(apiSection.id)
    merged.push(apiSection)
  })

  // Then, add any old sections that weren't in the API response (they might be new temp items)
  oldSections.forEach((oldSection) => {
    if (!processedApiIds.has(oldSection.id)) {
      merged.push(oldSection)
    }
  })

  return merged as SectionResponse[]
}
