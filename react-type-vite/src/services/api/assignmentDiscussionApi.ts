import axiosInstance from "@/services/api/httpClient/axiosInstance";
import type { DiscussionMessage, DiscussionMessageRequest } from "@/services/websocket/assignmentDiscussionWebSocket";

export interface DiscussionPageResponse {
  content: DiscussionMessage[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

/**
 * Get discussion messages for an assignment (REST API)
 */
export const getAssignmentDiscussion = async (
  assignmentId: number,
  page: number = 0,
  size: number = 20
): Promise<DiscussionPageResponse> => {
  const response = await axiosInstance.get<any>(
    `/server/discussions/assignment/${assignmentId}/messages`,
    {
      params: { page, size },
    }
  );
  console.log('GET assignment messages response:', response.data);
  // Backend returns Page directly, not wrapped in ApiResponse
  return response.data;
};


export const postAssignmentDiscussionMessage = async (
  assignmentId: number,
  request: DiscussionMessageRequest
): Promise<DiscussionMessage> => {
  console.log('POST assignment message request:', { assignmentId, request });
  const response = await axiosInstance.post<DiscussionMessage>(
    `/server/discussions/assignment/${assignmentId}/messages`,
    request
  );
  console.log('POST assignment message response:', response.data);
  // Backend returns message directly, not wrapped in ApiResponse
  return response.data;
};

/**
 * Delete an assignment discussion message
 */
export const deleteAssignmentDiscussionMessage = async (messageId: string): Promise<void> => {
  console.log('DELETE assignment message:', messageId);
  await axiosInstance.delete(`/server/discussions/assignment/messages/${messageId}`);
};

/**
 * Toggle like on an assignment discussion message
 */
export const toggleAssignmentDiscussionLike = async (messageId: string): Promise<DiscussionMessage> => {
  console.log('LIKE assignment message:', messageId);
  const response = await axiosInstance.post<DiscussionMessage>(
    `/server/discussions/assignment/messages/${messageId}/like`
  );
  console.log('LIKE assignment message response:', response.data);
  return response.data;
};

/**
 * Mark assignment discussion as read
 */
export const markAssignmentDiscussionAsRead = async (assignmentId: number): Promise<void> => {
  console.log('Mark assignment discussion as read:', assignmentId);
  await axiosInstance.post(`/server/discussions/assignment/${assignmentId}/mark-read`);
};

/**
 * Get unread message count
 */
export const getAssignmentUnreadCount = async (assignmentId: number): Promise<number> => {
  console.log('Get unread count for assignment:', assignmentId);
  const response = await axiosInstance.get<number>(
    `/server/discussions/assignment/${assignmentId}/unread-count`
  );
  return response.data;
};
