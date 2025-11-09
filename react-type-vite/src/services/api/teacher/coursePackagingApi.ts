import axiosInstance from "../httpClient/axiosInstance"
import type { BulkPublishRequest } from "../request/bulkPublishRequest"
import type { ContentPublishStatusResponse } from "../response/contentPublishStatusResponse"
import type { PublishCourseRequest } from "../request/publishCourseRequest"
import type { ApiResponse } from "../response/apiResponse"
import type { PublishedCourseResponse } from "../response/publishedCourseResponse"
import type { SectionResponse } from "../response/sectionResponse"

export const getPublishStatus = async (courseId: number): Promise<ContentPublishStatusResponse> => {
  const response = await axiosInstance.get<ApiResponse<ContentPublishStatusResponse>>(
    `/course-management/teacher/courses/${courseId}/publish-status`
  )
  return response.data.result
}

export const bulkPublish = async (request: BulkPublishRequest): Promise<ContentPublishStatusResponse> => {
  const response = await axiosInstance.post<ApiResponse<ContentPublishStatusResponse>>(
    `/course-management/teacher/courses/bulk-publish`,
    request
  )
  return response.data.result
}

export const publishAll = async (courseId: number, isPublished: boolean): Promise<ContentPublishStatusResponse> => {
  const response = await axiosInstance.post<ApiResponse<ContentPublishStatusResponse>>(
    `/course-management/teacher/courses/${courseId}/publish-all?isPublished=${isPublished}`
  )
  return response.data.result
}

export const createOrUpdateDraft = async (
  request: PublishCourseRequest,
  courseImage?: File,
  courseVideo?: File
): Promise<PublishedCourseResponse> => {
  const formData = new FormData();
  
  // Add JSON data as a blob
  const dataBlob = new Blob([JSON.stringify(request)], {
    type: 'application/json'
  });
  formData.append('data', dataBlob);
  
  // Add files if provided
  if (courseImage) {
    formData.append('courseImage', courseImage);
  }
  
  if (courseVideo) {
    formData.append('courseVideo', courseVideo);
  }

  const response = await axiosInstance.post<ApiResponse<PublishedCourseResponse>>(
    "/course-management/teacher/published-courses/draft",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  
  return response.data.result;
};

export const submitForApproval = async (courseId: number): Promise<PublishedCourseResponse> => {
  const response = await axiosInstance.post<ApiResponse<PublishedCourseResponse>>(
    `/course-management/teacher/published-courses/${courseId}/submit`
  )
  return response.data.result
}

export const checkCoursePublished = async (courseId: number): Promise<boolean> => {
  const response = await axiosInstance.get<ApiResponse<boolean>>(
    `/course-management/teacher/published-courses/check/${courseId}`
  )
  return response.data.result
}

export const getPublishedCourse = async (courseId: number): Promise<PublishedCourseResponse> => {
  const response = await axiosInstance.get<ApiResponse<PublishedCourseResponse>>(
    `/course-management/teacher/published-courses/course/${courseId}`
  )
  return response.data.result
}

export const toggleSectionPublish = async (sectionId: number, isPublished: boolean): Promise<void> => {
  await axiosInstance.put(
    `/course-management/teacher/courses/sections/${sectionId}/publish?isPublished=${isPublished}`
  )
}

export const toggleLessonPublish = async (lessonId: number, isPublished: boolean): Promise<void> => {
  await axiosInstance.put(
    `/course-management/teacher/courses/lessons/${lessonId}/publish?isPublished=${isPublished}`
  )
}

export const toggleQuizPublish = async (quizId: number, isPublished: boolean): Promise<void> => {
  await axiosInstance.put(
    `/course-management/teacher/courses/quizzes/${quizId}/publish?isPublished=${isPublished}`
  )
}

export const toggleAssignmentPublish = async (assignmentId: number, isPublished: boolean): Promise<void> => {
  await axiosInstance.put(
    `/course-management/teacher/courses/assignments/${assignmentId}/publish?isPublished=${isPublished}`
  )
}


export const getCourseSections = async (courseId: number): Promise<SectionResponse[]> => {
  const response = await axiosInstance.get<ApiResponse<SectionResponse[]>>(
    `/course-management/courses/${courseId}/sections`
  )
  return response.data.result
}