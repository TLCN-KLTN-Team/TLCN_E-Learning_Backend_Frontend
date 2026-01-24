import axiosInstance from "@/services/api/httpClient/axiosInstance";
import type { DiscussionMessage, DiscussionMessageRequest } from "@/services/websocket/lessonDiscussionWebSocket";

export interface DiscussionPageResponse {
  content: DiscussionMessage[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

/**
 * Get discussion messages for a lesson (REST API)
 */
export const getLessonDiscussion = async (
  lessonId: number,
  page: number = 0,
  size: number = 20
): Promise<DiscussionPageResponse> => {
  const response = await axiosInstance.get<any>(
    `/server/discussions/lesson/${lessonId}/messages`,
    {
      params: { page, size },
    }
  );
  console.log('GET lesson messages response:', response.data);
  return response.data;
};

export const postLessonDiscussionMessage = async (
  lessonId: number,
  request: DiscussionMessageRequest
): Promise<DiscussionMessage> => {
  console.log('POST lesson message request:', { lessonId, request });
  const response = await axiosInstance.post<DiscussionMessage>(
    `/server/discussions/lesson/${lessonId}/messages`,
    request
  );
  console.log('POST lesson message response:', response.data);
  return response.data;
};

/**
 * Delete a lesson discussion message
 */
export const deleteLessonDiscussionMessage = async (messageId: string): Promise<void> => {
  await axiosInstance.delete(`/server/discussions/lesson/messages/${messageId}`);
};

/**
 * Toggle like on a lesson discussion message
 */
export const toggleLessonDiscussionLike = async (messageId: string): Promise<DiscussionMessage> => {
  const response = await axiosInstance.post<DiscussionMessage>(
    `/server/discussions/lesson/messages/${messageId}/like`
  );
  return response.data;
};

/**
 * Mark all messages in a lesson discussion as read
 */
export const markLessonDiscussionAsRead = async (lessonId: number): Promise<void> => {
  await axiosInstance.post(`/server/discussions/lesson/${lessonId}/mark-read`);
};

/**
 * Get unread message count for a lesson discussion
 */
export const getLessonUnreadCount = async (lessonId: number): Promise<number> => {
  const response = await axiosInstance.get<number>(
    `/server/discussions/lesson/${lessonId}/unread-count`
  );
  return response.data;
};
