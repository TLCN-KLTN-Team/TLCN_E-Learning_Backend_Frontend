import axiosInstance from "../httpClient/axiosInstance"
import type { ApiResponse } from "../response/apiResponse"
import type { SectionRequest } from "../request/sectionRequest"

export interface SectionResponse {
  id: number
  courseId: number
  title: string
  description?: string
  orderIndex: number
  isPublished: boolean
  createdAt?: Date
  updatedAt?: Date
}

/**
 * Create a new section for a course
 * @param courseId - The course ID
 * @param sectionData - Section data to create
 * @returns Created section
 */
export const createSection = async (
  courseId: number,
  sectionData: Omit<SectionRequest, "id" | "courseId">,
): Promise<SectionResponse> => {
  const response = await axiosInstance.post<ApiResponse<SectionResponse>>(
    `/course-management/teacher/courses/${courseId}/sections`,
    sectionData,
  )
  return response.data.result
}

/**
 * Update an existing section
 * @param courseId - The course ID
 * @param sectionId - The section ID
 * @param sectionData - Updated section data
 * @returns Updated section
 */
export const updateSection = async (
  courseId: number,
  sectionId: number,
  sectionData: Partial<SectionRequest>,
): Promise<SectionResponse> => {
  const response = await axiosInstance.put<ApiResponse<SectionResponse>>(
    `/course-management/teacher/courses/${courseId}/sections/${sectionId}`,
    sectionData,
  )
  return response.data.result
}

/**
 * Delete a section
 * @param courseId - The course ID
 * @param sectionId - The section ID
 */
export const deleteSection = async (courseId: number, sectionId: number): Promise<void> => {
  await axiosInstance.delete(`/course-management/teacher/courses/${courseId}/sections/${sectionId}`)
}

/**
 * Reorder sections
 * @param courseId - The course ID
 * @param sectionIds - Array of section IDs in the new order
 * @returns Updated sections
 */
export const reorderSections = async (courseId: number, sectionIds: number[]): Promise<SectionResponse[]> => {
  const response = await axiosInstance.put<ApiResponse<SectionResponse[]>>(
    `/course-management/teacher/courses/${courseId}/sections/reorder`,
    { sectionIds },
  )
  return response.data.result
}
