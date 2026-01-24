import axiosInstance from "@/services/api/httpClient/axiosInstance";

export interface DiscussionMessage {
  id: string;
  quizId: number;
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
 * Get discussion messages for a published course quiz
 */
export const getCourseQuizDiscussion = async (
  publishedCourseId: number,
  quizId: number,
  page: number = 0,
  size: number = 20
): Promise<DiscussionPageResponse> => {
  const response = await axiosInstance.get<DiscussionPageResponse>(
    `/server/course-discussions/quiz/${publishedCourseId}/${quizId}/messages`,
    {
      params: { page, size },
    }
  );
  return response.data;
};

/**
 * Post a new discussion message for a published course quiz
 */
export const postCourseQuizDiscussionMessage = async (
  publishedCourseId: number,
  quizId: number,
  request: DiscussionMessageRequest
): Promise<DiscussionMessage> => {
  const response = await axiosInstance.post<DiscussionMessage>(
    `/server/course-discussions/quiz/${publishedCourseId}/${quizId}/messages`,
    request
  );
  return response.data;
};

/**
 * Delete a discussion message
 */
export const deleteCourseQuizDiscussionMessage = async (messageId: string): Promise<void> => {
  await axiosInstance.delete(`/server/course-discussions/quiz/messages/${messageId}`);
};

/**
 * Toggle like on a discussion message
 */
export const toggleCourseQuizDiscussionLike = async (messageId: string): Promise<DiscussionMessage> => {
  const response = await axiosInstance.post<DiscussionMessage>(
    `/server/course-discussions/quiz/messages/${messageId}/like`
  );
  return response.data;
};

/**
 * Mark discussion as read
 */
export const markCourseQuizDiscussionAsRead = async (publishedCourseId: number, quizId: number): Promise<void> => {
  await axiosInstance.post(`/server/course-discussions/quiz/${publishedCourseId}/${quizId}/mark-read`);
};

/**
 * Get unread message count
 */
export const getCourseQuizUnreadCount = async (publishedCourseId: number, quizId: number): Promise<number> => {
  const response = await axiosInstance.get<number>(
    `/server/course-discussions/quiz/${publishedCourseId}/${quizId}/unread-count`
  );
  return response.data;
};

/**
 * Get unread counts for multiple quizzes in a published course
 */
export const getCourseBatchQuizUnreadCounts = async (
  publishedCourseId: number,
  quizIds: number[]
): Promise<Record<number, number>> => {
  const response = await axiosInstance.get<Record<number, number>>(
    `/server/course-discussions/quiz/${publishedCourseId}/batch-unread-counts`,
    {
      params: { quizIds: quizIds.join(',') }
    }
  );
  return response.data;
};
