import axiosInstance from "../httpClient/axiosInstance";
import type { ReviewResponse, ReviewStatsResponse, CreateReviewRequest } from "../response/reviewResponse";
import type { ApiResponse } from "../response/apiResponse";

const reviewApi = {
  // Get all reviews for a course
  getCourseReviews: async (courseId: number): Promise<ReviewResponse[]> => {
    const url = `/course-management/anonymous/reviews/course/${courseId}`;
    const response = await axiosInstance.get<ApiResponse<ReviewResponse[]>>(url);
    console.log("👉 Review API response:", response.data);         // In toàn bộ API
    console.log("👉 Review list:", response.data.result);           // In danh sách review
    return response.data.result;
  },

  // Get review statistics for a course
  getCourseReviewStats: async (courseId: number): Promise<ReviewStatsResponse> => {
    const url = `/course-management/anonymous/reviews/course/${courseId}/stats`;
    const response = await axiosInstance.get<ApiResponse<ReviewStatsResponse>>(url);
    return response.data.result;
  },

  // Create a new review
  createReview: async (data: CreateReviewRequest): Promise<ReviewResponse> => {
    const url = `/course-management/user/reviews`;
    const response = await axiosInstance.post<ApiResponse<ReviewResponse>>(url, data);
    return response.data.result;
  },

  // Update a review
  updateReview: async (reviewId: number, data: { rate: number; content: string }): Promise<ReviewResponse> => {
    const url = `/course-management/user/reviews/${reviewId}`;
    console.log("👉 Updating review:", { reviewId, data });
    try {
      const response = await axiosInstance.put<ApiResponse<ReviewResponse>>(url, data);
      console.log("✅ Update review success:", response.data);
      return response.data.result;
    } catch (error: any) {
      console.error("❌ Update review failed:", error.response?.data || error.message);
      throw error;
    }
  },

  // Delete a review
  deleteReview: async (reviewId: number): Promise<void> => {
    const url = `/course-management/user/reviews/${reviewId}`;
    console.log("👉 Deleting review:", reviewId);
    try {
      await axiosInstance.delete(url);
      console.log("✅ Delete review success");
    } catch (error: any) {
      console.error("❌ Delete review failed:", error.response?.data || error.message);
      throw error;
    }
  },

  // Get user's review for a course (check if already reviewed)
  getUserReviewForCourse: async (courseId: number): Promise<ReviewResponse | null> => {
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
  },
};

export default reviewApi;
