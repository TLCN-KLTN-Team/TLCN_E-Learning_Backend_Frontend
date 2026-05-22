import type {
  GenerateQuizUserRequest,
  GenerateQuizResponse,
  QuizSetResponse,
  SaveQuizSetRequest,
} from "@/types/quiz.type";
import type { ApiResponse } from "../response/apiResponse";
import axiosInstance from "../httpClient/axiosInstance";

const QUIZ_API = "/ai/quiz";

/**
 * Generate quiz cho luồng học viên (Bước 1 -> CĐR). Spring proxies sang
 * Python `/generate/user`.
 */
export const generateQuizForUser = async (
  request: GenerateQuizUserRequest,
): Promise<GenerateQuizResponse> => {
  const response = await axiosInstance.post<ApiResponse<GenerateQuizResponse>>(
    `${QUIZ_API}/user/generate`,
    request,
  );
  return response.data.result;
};

/**
 * Lưu một bộ quiz vào kho tài liệu (sau phase tạo của AIQuizPractice).
 */
export const saveQuizSet = async (
  request: SaveQuizSetRequest,
): Promise<QuizSetResponse> => {
  const response = await axiosInstance.post<ApiResponse<QuizSetResponse>>(
    `${QUIZ_API}/save`,
    request,
  );
  return response.data.result;
};

/**
 * Lấy toàn bộ quiz set của một user (phục vụ kho tài liệu).
 */
export const getQuizSetsByUser = async (
  userId: string,
): Promise<QuizSetResponse[]> => {
  const response = await axiosInstance.get<ApiResponse<QuizSetResponse[]>>(
    `${QUIZ_API}/user/${userId}`,
  );
  return response.data.result ?? [];
};

export const getQuizSetById = async (
  id: string,
): Promise<QuizSetResponse> => {
  const response = await axiosInstance.get<ApiResponse<QuizSetResponse>>(
    `${QUIZ_API}/${id}`,
  );
  return response.data.result;
};

export const deleteQuizSet = async (id: string): Promise<void> => {
  await axiosInstance.delete(`${QUIZ_API}/${id}`);
};

export default {
  generateQuizForUser,
  saveQuizSet,
  getQuizSetsByUser,
  getQuizSetById,
  deleteQuizSet,
};
