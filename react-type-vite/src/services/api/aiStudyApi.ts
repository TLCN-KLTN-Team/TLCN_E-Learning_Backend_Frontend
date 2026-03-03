import axiosInstance from "./httpClient/axiosInstance";

export interface AIStudySubmitRequest {
  courseId?: string;
  chapterIds: string[];
  internalContent: string; // Content from selected chapters
  externalContent: string; // Content from uploaded documents
  mergedContent: string; // Combined content for AI processing
  mode: "study" | "quiz" | "flashcard";
}

export interface AIStudySubmitResponse {
  success: boolean;
  message: string;
  data?: {
    studyPlanId: string;
    recommendations: string[];
    estimatedTime: number; // in minutes
  };
}

/**
 * Submit merged content to AI backend for study mode processing
 */
export const submitAIStudyContent = async (
  request: AIStudySubmitRequest,
): Promise<AIStudySubmitResponse> => {
  const response = await axiosInstance.post<AIStudySubmitResponse>(
    "/ai/study/submit",
    request,
  );
  return response.data;
};

/**
 * Cancel an ongoing AI study request
 */
export const cancelAIStudyRequest = async (
  requestId: string,
): Promise<{ success: boolean }> => {
  const response = await axiosInstance.post<{ success: boolean }>(
    `/ai/study/${requestId}/cancel`,
  );
  return response.data;
};

/**
 * Get status of AI study request
 */
export const getAIStudyStatus = async (
  requestId: string,
): Promise<{
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  result?: AIStudySubmitResponse;
}> => {
  const response = await axiosInstance.get(`/ai/study/${requestId}/status`);
  return response.data;
};

export default {
  submitAIStudyContent,
  cancelAIStudyRequest,
  getAIStudyStatus,
};
