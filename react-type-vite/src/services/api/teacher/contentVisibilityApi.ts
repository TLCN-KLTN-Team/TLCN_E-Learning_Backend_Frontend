// src/services/api/teacher/contentVisibilityApi.ts
import axiosInstance from "../httpClient/axiosInstance";
import type { ApiResponse } from "../response/apiResponse";

export interface ContentVisibilityRequest {
  contentType: string;
  contentId: number;
  visibleClassIds: number[];
}

export interface ClassVisibilityInfo {
  classId: number;
  className: string;
  isVisible: boolean;
  updatedAt?: Date;
}

export interface ContentVisibilityResponse {
  contentType: string;
  contentId: number;
  contentTitle: string;
  classVisibilities: ClassVisibilityInfo[];
}

/**
 * Get section visibility settings
 */
export const getSectionVisibility = async (
  courseId: number,
  sectionId: number
): Promise<ContentVisibilityResponse> => {
  const response = await axiosInstance.get<ApiResponse<ContentVisibilityResponse>>(
    `/course-management/teacher/courses/content-visibility/section/${sectionId}?courseId=${courseId}`
  );
  return response.data.result;
};

/**
 * Update section visibility settings
 */
export const updateSectionVisibility = async (
  sectionId: number,
  visibleClassIds: number[]
): Promise<void> => {
  await axiosInstance.put(
    `/course-management/teacher/courses/content-visibility/section/${sectionId}`,
    { visibleClassIds }
  );
};

export const getLessonVisibility = async (
  courseId: number,
  lessonId: number
): Promise<ContentVisibilityResponse> => {
  const response = await axiosInstance.get<ApiResponse<ContentVisibilityResponse>>(
    `/course-management/teacher/courses/content-visibility/lesson/${lessonId}?courseId=${courseId}`
  );
  return response.data.result;
};

/**
 * Update lesson visibility settings
 */
export const updateLessonVisibility = async (
  lessonId: number,
  visibleClassIds: number[]
): Promise<void> => {
  await axiosInstance.put(
    `/course-management/teacher/courses/content-visibility/lesson/${lessonId}`,
    { visibleClassIds }
  );
};

/**
 * Get quiz visibility settings
 */
export const getQuizVisibility = async (
  courseId: number,
  quizId: number
): Promise<ContentVisibilityResponse> => {
  const response = await axiosInstance.get<ApiResponse<ContentVisibilityResponse>>(
    `/course-management/teacher/courses/content-visibility/quiz/${quizId}?courseId=${courseId}`
  );
  return response.data.result;
};

/**
 * Update quiz visibility settings
 */
export const updateQuizVisibility = async (
  quizId: number,
  visibleClassIds: number[]
): Promise<void> => {
  await axiosInstance.put(
    `/course-management/teacher/courses/content-visibility/quiz/${quizId}`,
    { visibleClassIds }
  );
};

/**
 * Get assignment visibility settings
 */
export const getAssignmentVisibility = async (
  courseId: number,
  assignmentId: number
): Promise<ContentVisibilityResponse> => {
  const response = await axiosInstance.get<ApiResponse<ContentVisibilityResponse>>(
    `/course-management/teacher/courses/content-visibility/assignment/${assignmentId}?courseId=${courseId}`
  );
  return response.data.result;
};

/**
 * Update assignment visibility settings
 */
export const updateAssignmentVisibility = async (
  assignmentId: number,
  visibleClassIds: number[]
): Promise<void> => {
  await axiosInstance.put(
    `/course-management/teacher/courses/content-visibility/assignment/${assignmentId}`,
    { visibleClassIds }
  );
};