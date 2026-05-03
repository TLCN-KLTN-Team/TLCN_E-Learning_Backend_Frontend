import axiosInstance from "../httpClient/axiosInstance";
import type { ReviewResponse, ReviewStatsResponse, CreateReviewRequest } from "../response/reviewResponse";
import type { ApiResponse } from "../response/apiResponse";

export const getCourseReviews = async (courseId: number): Promise<ReviewResponse[]> => {
  const url = `/course-management/anonymous/reviews/course/${courseId}`;
  const response = await axiosInstance.get<ApiResponse<ReviewResponse[]>>(url);
  return response.data.result;
};

export const getCourseReviewStats = async (courseId: number): Promise<ReviewStatsResponse> => {
  const url = `/course-management/anonymous/reviews/course/${courseId}/stats`;
  const response = await axiosInstance.get<ApiResponse<ReviewStatsResponse>>(url);
  return response.data.result;
};

export const createReview = async (data: CreateReviewRequest): Promise<ReviewResponse> => {
  const url = `/course-management/user/reviews`;
  const response = await axiosInstance.post<ApiResponse<ReviewResponse>>(url, data);
  return response.data.result;
};

export const updateReview = async (reviewId: number, data: { rate: number; content: string }): Promise<ReviewResponse> => {
  const url = `/course-management/user/reviews/${reviewId}`;
  try {
    const response = await axiosInstance.put<ApiResponse<ReviewResponse>>(url, data);
    return response.data.result;
  } catch (error: any) {
    throw error;
  }
};

export const deleteReview = async (reviewId: number): Promise<void> => {
  const url = `/course-management/user/reviews/${reviewId}`;
  try {
    await axiosInstance.delete(url);
  } catch (error: any) {
    throw error;
  }
};

export const getUserReviewForCourse = async (courseId: number): Promise<ReviewResponse | null> => {
  const url = `/course-management/user/reviews/course/${courseId}/my-review`;
  try {
    const response = await axiosInstance.get<ApiResponse<ReviewResponse>>(url);
    return response.data.result;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};
