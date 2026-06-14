import type {
  CompletionSuggestionResponse,
  PublishedCourseDetailResponse,
  PublishedCourseResponse,
  PublishedCourseCardResponse,
} from "@/types/course.types";
import type { ApiResponse, PaginatedResponse } from "../response/apiResponse";
import axiosInstance from "../httpClient/axiosInstance";

const PUBLISHED_COURSES_ENDPOINT = "/course-management/published-courses";

const searchAndFiltersPublishedCourses = async (
  page: number,
  size: number,
  keyword?: string,
  minRating?: number,
  practiceTypes?: string[],
  fees?: string[],
  levels?: string[],
  durations?: string[],
  category?: string,
  sortBy?: string
): Promise<PaginatedResponse<PublishedCourseResponse>> => {
  // Build query params properly
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });

  if (keyword && keyword.trim()) {
    params.append("keyword", keyword.trim());
  }
  if (minRating !== undefined) {
    params.append("minRating", minRating.toString());
  }
  if (levels && levels.length > 0) {
    levels.forEach((level) => params.append("levels", level));
  }
  if (durations && durations.length > 0) {
    durations.forEach((d) => params.append("durations", d));
  }
  if (category) {
    params.append("category", category);
  }
  if (practiceTypes && practiceTypes.length > 0) {
    practiceTypes.forEach((type) => params.append("practiceTypes", type));
  }
  if (fees && fees.length > 0) {
    fees.forEach((fee) => params.append("fees", fee));
  }
  if (sortBy) {
    params.append("sort", sortBy);
  }

  const response = await axiosInstance.get<
    ApiResponse<PaginatedResponse<PublishedCourseResponse>>
  >(`${PUBLISHED_COURSES_ENDPOINT}/search?${params.toString()}`);

  return response.data.result;
};

const autoCompletion = async (
  query: string,
  size: number = 10
): Promise<CompletionSuggestionResponse> => {
  if (!query || !query.trim()) {
    return { titleSuggestions: [] };
  }

  const params = new URLSearchParams({
    q: query.trim(),
    size: size.toString(),
  });

  const response = await axiosInstance.get<
    ApiResponse<CompletionSuggestionResponse>
  >(`${PUBLISHED_COURSES_ENDPOINT}/auto-completion?${params.toString()}`);

  return response.data.result;
};

const getPublishedCourseDetails = async (
  courseId: string
): Promise<PublishedCourseDetailResponse> => {
  const response = await axiosInstance.get<
    ApiResponse<PublishedCourseDetailResponse>
  >(`${PUBLISHED_COURSES_ENDPOINT}/${courseId}`);
  return response.data.result;
};

const getRecommendedCourses = async (): Promise<PublishedCourseCardResponse[]> => {
  const response = await axiosInstance.get<
    ApiResponse<PublishedCourseCardResponse[]>
  >(`${PUBLISHED_COURSES_ENDPOINT}/recommend`);
  return response.data.result;
};

export default {
  searchAndFiltersPublishedCourses,
  autoCompletion,
  getPublishedCourseDetails,
  getRecommendedCourses,
};
