import axiosInstance from "../httpClient/axiosInstance";
import type { ApiResponse } from "../response/apiResponse";

const API_WISHLIST_ENDPOINT = "/course-management/wishlists";

export interface WishlistCourse {
  courseId: number;
  courseName: string;
  authorName: string;
  rating: number;
  duration: number;
  originalPrice: string;
  currentPrice: string;
  thumbnailUrl?: string;
}

export interface WishlistResponse {
  wishlistCourses: WishlistCourse[];
  totalCourses: number;
}

const getWishlist = async (): Promise<WishlistResponse> => {
  const response = await axiosInstance.get<ApiResponse<WishlistResponse>>(
    `${API_WISHLIST_ENDPOINT}`
  );
  return response.data.result;
};

const checkPublishedCourseInWishlist = async (
  courseId: number
): Promise<boolean> => {
  const response = await axiosInstance.get<ApiResponse<boolean>>(
    `${API_WISHLIST_ENDPOINT}/exist/${courseId}`
  );
  return response.data.result;
};

const createWishlist = async () => {
  const response = await axiosInstance.post(`${API_WISHLIST_ENDPOINT}`);
  return response.data;
};

const addToWishlist = async (courseId: number) => {
  const response = await axiosInstance.post(
    `${API_WISHLIST_ENDPOINT}/add/${courseId}`
  );
  return response.data;
};

const removeFromWishlist = async (courseId: number) => {
  const response = await axiosInstance.post(
    `${API_WISHLIST_ENDPOINT}/remove/${courseId}`
  );
  return response.data;
};

export default {
  getWishlist,
  checkPublishedCourseInWishlist,
  createWishlist,
  addToWishlist,
  removeFromWishlist,
};
