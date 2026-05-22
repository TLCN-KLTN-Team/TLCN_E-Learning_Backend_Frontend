import type {
  FlashCardRequest,
  FlashCardResponse,
  FlashcardSetResponse,
  SaveFlashcardSetRequest,
} from "@/types/flashcard.type";
import type { ApiResponse } from "../response/apiResponse";
import axiosInstance from "../httpClient/axiosInstance";

const FLASHCARD_API = "/ai/flashcards";

/**
 * Generate flashcards via the API Gateway (which proxies to the Spring AI
 * service, which in turn calls the Python flashcard service).
 */
export const generateFlashcards = async (
  request: FlashCardRequest,
): Promise<FlashCardResponse> => {
  const response = await axiosInstance.post<ApiResponse<FlashCardResponse>>(
    `${FLASHCARD_API}/generate`,
    request,
  );
  return response.data.result;
};

/**
 * Lưu một bộ flashcard mới vào kho tài liệu.
 */
export const saveFlashcardSet = async (
  request: SaveFlashcardSetRequest,
): Promise<FlashcardSetResponse> => {
  const response = await axiosInstance.post<ApiResponse<FlashcardSetResponse>>(
    `${FLASHCARD_API}/save`,
    request,
  );
  return response.data.result;
};

/**
 * Lấy toàn bộ flashcard set của một tác giả (phục vụ kho tài liệu).
 */
export const getFlashcardSetsByAuthor = async (
  authorId: string,
): Promise<FlashcardSetResponse[]> => {
  const response = await axiosInstance.get<
    ApiResponse<FlashcardSetResponse[]>
  >(`${FLASHCARD_API}/author/${authorId}`);
  return response.data.result ?? [];
};

export const getFlashcardSetById = async (
  id: string,
): Promise<FlashcardSetResponse> => {
  const response = await axiosInstance.get<ApiResponse<FlashcardSetResponse>>(
    `${FLASHCARD_API}/${id}`,
  );
  return response.data.result;
};

export const deleteFlashcardSet = async (id: string): Promise<void> => {
  await axiosInstance.delete(`${FLASHCARD_API}/${id}`);
};

export default {
  generateFlashcards,
  saveFlashcardSet,
  getFlashcardSetsByAuthor,
  getFlashcardSetById,
  deleteFlashcardSet,
};
