import axiosInstance from "@/services/api/httpClient/axiosInstance";

export interface DiscussionMessage {
  id: string;
  assignmentId: number;
  publishedCourseId: number;
  userId: string;
  userName: string;
  content: string;
  imageUrl?: string;
  likes: number;
  likedBy: string[];
  createdAt: string;
}

export interface DiscussionMessageRequest {
  content: string;
  imageUrl?: string;
}

export interface DiscussionPageResponse {
  content: DiscussionMessage[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

/**
 * Get discussion messages for a published course assignment
 */
export const getCourseAssignmentDiscussion = async (
  publishedCourseId: number,
  assignmentId: number,
  page: number = 0,
  size: number = 20
): Promise<DiscussionPageResponse> => {
  const response = await axiosInstance.get<DiscussionPageResponse>(
    `/server/course-discussions/assignment/${publishedCourseId}/${assignmentId}/messages`,
    {
      params: { page, size },
    }
  );
  return response.data;
};

/**
 * Post a new discussion message for a published course assignment
 */
export const postCourseAssignmentDiscussionMessage = async (
  publishedCourseId: number,
  assignmentId: number,
  request: DiscussionMessageRequest
): Promise<DiscussionMessage> => {
  const response = await axiosInstance.post<DiscussionMessage>(
    `/server/course-discussions/assignment/${publishedCourseId}/${assignmentId}/messages`,
    request
  );
  return response.data;
};

/**
 * Delete a discussion message
 */
export const deleteCourseAssignmentDiscussionMessage = async (messageId: string): Promise<void> => {
  await axiosInstance.delete(`/server/course-discussions/assignment/messages/${messageId}`);
};

/**
 * Toggle like on a discussion message
 */
export const toggleCourseAssignmentDiscussionLike = async (messageId: string): Promise<DiscussionMessage> => {
  const response = await axiosInstance.post<DiscussionMessage>(
    `/server/course-discussions/assignment/messages/${messageId}/like`
  );
  return response.data;
};

/**
 * Mark discussion as read
 */
export const markCourseAssignmentDiscussionAsRead = async (publishedCourseId: number, assignmentId: number): Promise<void> => {
  await axiosInstance.post(`/server/course-discussions/assignment/${publishedCourseId}/${assignmentId}/mark-read`);
};

/**
 * Get unread message count
 */
export const getCourseAssignmentUnreadCount = async (publishedCourseId: number, assignmentId: number): Promise<number> => {
  const response = await axiosInstance.get<number>(
    `/server/course-discussions/assignment/${publishedCourseId}/${assignmentId}/unread-count`
  );
  return response.data;
};

/**
 * Get unread counts for multiple assignments in a published course
 */
export const getCourseBatchAssignmentUnreadCounts = async (
  publishedCourseId: number,
  assignmentIds: number[]
): Promise<Record<number, number>> => {
  const response = await axiosInstance.get<Record<number, number>>(
    `/server/course-discussions/assignment/${publishedCourseId}/batch-unread-counts`,
    {
      params: { assignmentIds: assignmentIds.join(',') }
    }
  );
  return response.data;
};
