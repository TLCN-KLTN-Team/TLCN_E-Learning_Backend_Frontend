import axiosInstance from "@/services/api/httpClient/axiosInstance";

export interface CourseLessonDiscussionMessage {
  content: string;
  imageUrl?: string;
  userName?: string;
  userAvatar?: string;
}

export const getCourseLessonDiscussion = async (
  publishedCourseId: number,
  lessonId: number,
  page: number = 0,
  size: number = 50
) => {
  const response = await axiosInstance.get(
    `/server/course-discussions/lesson/${publishedCourseId}/${lessonId}`,
    {
      params: { page, size },
    }
  );
  return response.data;
};

export const postCourseLessonDiscussionMessage = async (
  publishedCourseId: number,
  lessonId: number,
  message: CourseLessonDiscussionMessage
) => {
  const response = await axiosInstance.post(
    `/server/course-discussions/lesson/${publishedCourseId}/${lessonId}/messages`,
    message
  );
  return response.data;
};

export const deleteCourseLessonDiscussionMessage = async (messageId: string) => {
  const response = await axiosInstance.delete(
    `/server/course-discussions/lesson/messages/${messageId}`
  );
  return response.data;
};

export const toggleCourseLessonDiscussionLike = async (messageId: string) => {
  const response = await axiosInstance.post(
    `/server/course-discussions/lesson/messages/${messageId}/like`
  );
  return response.data;
};

export const markCourseLessonDiscussionAsRead = async (
  publishedCourseId: number,
  lessonId: number
) => {
  const response = await axiosInstance.post(
    `/server/course-discussions/lesson/${publishedCourseId}/${lessonId}/mark-read`
  );
  return response.data;
};

export const getCourseLessonDiscussionUnreadCount = async (
  publishedCourseId: number,
  lessonId: number
) => {
  const response = await axiosInstance.get(
    `/server/course-discussions/lesson/${publishedCourseId}/${lessonId}/unread-count`
  );
  return response.data;
};

/**
 * Get unread counts for multiple lessons in a published course
 */
export const getCourseBatchLessonUnreadCounts = async (
  publishedCourseId: number,
  lessonIds: number[]
): Promise<Record<number, number>> => {
  const response = await axiosInstance.get<Record<number, number>>(
    `/server/course-discussions/lesson/${publishedCourseId}/batch-unread-counts`,
    {
      params: { lessonIds: lessonIds.join(',') }
    }
  );
  return response.data;
};
