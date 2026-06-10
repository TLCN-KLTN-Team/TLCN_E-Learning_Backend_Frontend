import axiosInstance from "../httpClient/axiosInstance";
import type { ApiResponse } from "../response/apiResponse";

const API_CART_ENPOINT = "/course-management/user/carts";

export interface CartCourse {
  courseId: number;
  courseName: string;
  authorName: string;
  rating: number;
  duration: number;
  currentPrice: string;
  thumbnail?: string;
}

export interface CartResponse {
  amount: string;
  cartCourses: CartCourse[];
  favoriteCourses: CartCourse[];
}

const getCart = async (): Promise<CartResponse> => {
  const response = await axiosInstance.get<ApiResponse<CartResponse>>(
    `${API_CART_ENPOINT}`
  );
  return response.data.result;
};

const checkPublishedCourseInCart = async (
  courseId: number
): Promise<boolean> => {
  const response = await axiosInstance.get<ApiResponse<boolean>>(
    `${API_CART_ENPOINT}/exist/${courseId}`
  );
  return response.data.result;
};

const createCart = async () => {
  const response = await axiosInstance.post(`${API_CART_ENPOINT}`);
  return response.data;
};

const addToCart = async (courseId: number) => {
  const response = await axiosInstance.post(
    `${API_CART_ENPOINT}/add/${courseId}`
  );
  return response.data;
};

const addWishlistItemToCart = async (courseId: number) => {
  const response = await axiosInstance.post(
    `${API_CART_ENPOINT}/add-from-wishlist/${courseId}`
  );
  return response.data;
};

const removeFromCart = async (courseId: number) => {
  const response = await axiosInstance.post(
    `${API_CART_ENPOINT}/remove/${courseId}`
  );
  return response.data;
};

export default {
  getCart,
  checkPublishedCourseInCart,
  createCart,
  addToCart,
  addWishlistItemToCart,
  removeFromCart,
};
