import type {
  PublishedCourseCardResponse,
  ReviewCardResponse,
} from "@/types/course.types";
import type {
  EducationalUnitCardResponse,
  EducationalUnitDetailResponse,
} from "@/types/educational-unit.types";
import type { ApiResponse } from "../response/apiResponse";
import publicAxiosInstance from "../httpClient/publicAxiosInstance";
import axiosInstance from "../httpClient/axiosInstance";

const HOME_ENDPOINT = "/course-management/anonymous/home";
/**
 * Phiên bản yêu cầu đăng nhập của các danh sách khóa học trang chủ.
 * Khi gọi kèm token, service lọc bỏ những khóa học người dùng đã sở hữu.
 */
const USER_HOME_ENDPOINT = "/course-management/user/home";

/**
 * Get all educational units
 * @returns List of educational units with basic information
 */
export const getAllEducationalUnits = async (): Promise<
  EducationalUnitCardResponse[]
> => {
  const response = await publicAxiosInstance.get<
    ApiResponse<EducationalUnitCardResponse[]>
  >(`${HOME_ENDPOINT}/educational-units`);
  return response.data.result;
};

/**
 * Get courses sorted by rating (highest rated courses)
 * @param authenticated - Nếu true, gọi endpoint /user/home (kèm token) để lọc bỏ khóa học đã sở hữu
 * @returns List of top-rated courses
 */
export const getCoursesByRating = async (
  authenticated = false
): Promise<PublishedCourseCardResponse[]> => {
  const client = authenticated ? axiosInstance : publicAxiosInstance;
  const endpoint = authenticated ? USER_HOME_ENDPOINT : HOME_ENDPOINT;
  const response = await client.get<
    ApiResponse<PublishedCourseCardResponse[]>
  >(`${endpoint}/courses/ratings`);
  return response.data.result;
};

/**
 * Get best-selling courses (top 12)
 * @param authenticated - Nếu true, gọi endpoint /user/home (kèm token) để lọc bỏ khóa học đã sở hữu
 * @returns List of best-selling courses
 */
export const getBestSellerCourses = async (
  authenticated = false
): Promise<PublishedCourseCardResponse[]> => {
  const client = authenticated ? axiosInstance : publicAxiosInstance;
  const endpoint = authenticated ? USER_HOME_ENDPOINT : HOME_ENDPOINT;
  const response = await client.get<
    ApiResponse<PublishedCourseCardResponse[]>
  >(`${endpoint}/courses/best-sellers`);
  return response.data.result;
};

/**
 * Get educational unit detail by ID
 * @param id - Educational unit ID
 * @returns Educational unit detail information
 */
export const getEducationalUnitById = async (
  id: number
): Promise<EducationalUnitDetailResponse> => {
  const response = await publicAxiosInstance.get<
    ApiResponse<EducationalUnitDetailResponse>
  >(`${HOME_ENDPOINT}/educational-units/${id}`);
  return response.data.result;
};

/**
 * Get top 5 reviews
 * @returns List of top 5 best reviews
 */
export const getTop5Reviews = async (): Promise<ReviewCardResponse[]> => {
  const response = await publicAxiosInstance.get<
    ApiResponse<ReviewCardResponse[]>
  >(`${HOME_ENDPOINT}/reviews/top5`);
  return response.data.result;
};
