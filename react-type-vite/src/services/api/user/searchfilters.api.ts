import type { PublishedCourseResponse } from "@/types/course.types";
import axiosInstance from "../httpClient/axiosInstance";
import type { ApiResponse, PaginatedResponse } from "../response/apiResponse";

const API_URL_ENDPOINT = "/course-management/search-filters";

interface PublishedCourseDocument {
  id: string;
  courseName: string;
  description: string;
  category: string;
  level: string;
  price: number;
  rating: number;
  studentsCount: number;
}

interface CompletionSuggestionResponse {
  titleSuggestions: string[];
}

const searchAndFiltersPublishedCourses = async (
  page: number,
  size: number,
  keyword?: string,
  minPrice?: number,
  maxPrice?: number,
  minRating?: number,
  levels?: string[],
  categories?: string[],
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
  if (minPrice !== undefined) {
    params.append("minPrice", minPrice.toString());
  }
  if (maxPrice !== undefined) {
    params.append("maxPrice", maxPrice.toString());
  }
  if (minRating !== undefined) {
    params.append("minRating", minRating.toString());
  }
  if (levels && levels.length > 0) {
    levels.forEach((level) => params.append("levels", level));
  }
  if (categories && categories.length > 0) {
    categories.forEach((category) => params.append("categories", category));
  }
  if (sortBy) {
    params.append("sortBy", sortBy);
  }

  const response = await axiosInstance.get<
    ApiResponse<PaginatedResponse<PublishedCourseResponse>>
  >(`${API_URL_ENDPOINT}/search?${params.toString()}`);

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
  >(`${API_URL_ENDPOINT}/auto-completion?${params.toString()}`);

  return response.data.result;
};

export default {
  searchAndFiltersPublishedCourses,
  autoCompletion,
};

export type { PublishedCourseDocument, CompletionSuggestionResponse };
