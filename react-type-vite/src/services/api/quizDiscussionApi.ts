import axiosInstance from "@/services/api/httpClient/axiosInstance";
import type { ApiResponse } from "@/services/api/response/apiResponse";
import type { DiscussionMessage, DiscussionMessageRequest } from "@/services/websocket/quizDiscussionWebSocket";

export interface DiscussionPageResponse {
  content: DiscussionMessage[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

/**
 * Get discussion messages for a quiz (REST API)
 */
export const getQuizDiscussion = async (
  quizId: number,
  page: number = 0,
  size: number = 20
): Promise<DiscussionPageResponse> => {
  const response = await axiosInstance.get<any>(
    `/server/api/discussions/quiz/${quizId}/messages`,
    {
      params: { page, size },
    }
  );
  console.log('GET messages response:', response.data);
  // Backend returns Page directly, not wrapped in ApiResponse
  return response.data;
};


export const postDiscussionMessage = async (
  quizId: number,
  request: DiscussionMessageRequest
): Promise<DiscussionMessage> => {
  console.log('POST message request:', { quizId, request });
  const response = await axiosInstance.post<DiscussionMessage>(
    `/server/api/discussions/quiz/${quizId}/messages`,
    request
  );
  console.log('POST message response:', response.data);
  // Backend returns message directly, not wrapped in ApiResponse
  return response.data;
};

/**
 * Delete a discussion message
 */
export const deleteDiscussionMessage = async (messageId: string): Promise<void> => {
  console.log('DELETE message:', messageId);
  await axiosInstance.delete(`/server/api/discussions/quiz/messages/${messageId}`);
};

/**
 * Toggle like on a discussion message
 */
export const toggleDiscussionLike = async (messageId: string): Promise<DiscussionMessage> => {
  console.log('LIKE message:', messageId);
  const response = await axiosInstance.post<DiscussionMessage>(
    `/server/api/discussions/quiz/messages/${messageId}/like`
  );
  console.log('LIKE message response:', response.data);
  return response.data;
};

/**
 * Mark discussion as read
 */
export const markDiscussionAsRead = async (quizId: number): Promise<void> => {
  console.log('Mark discussion as read:', quizId);
  await axiosInstance.post(`/server/api/discussions/quiz/${quizId}/mark-read`);
};

/**
 * Get unread message count
 */
export const getUnreadCount = async (quizId: number): Promise<number> => {
  console.log('Get unread count for quiz:', quizId);
  const response = await axiosInstance.get<number>(
    `/server/api/discussions/quiz/${quizId}/unread-count`
  );
  return response.data;
};
