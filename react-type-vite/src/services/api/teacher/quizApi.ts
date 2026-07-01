/**
 * This module provides API functions related to quiz management for teachers.
 */

import { getAccessToken } from "@/utils/localStorageVariables";
import axiosInstance from "../httpClient/axiosInstance";
import type { ApiResponse } from "../response/apiResponse";
import type { GenerateQuizUserRequest, GenerateQuizResponse } from "@/types/quiz.type";

const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:8888/api/v1";

const summarizeExtractionFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const token = getAccessToken();
    const headers: HeadersInit = { Accept: "text/event-stream" };
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${BASE_URL}/ai/parser/summary`, {
            method: "POST",
            headers,
            body: formData,
        });
        return response;
    } catch (error) {
        console.error("Upload error:", error);
    }
};

/**
 * Gọi endpoint /ai/quiz/generate (luồng giảng viên) để tạo qui từ nguồn dữ liệu.
 */
const generateQuiz = async (request: GenerateQuizUserRequest): Promise<GenerateQuizResponse> => {
    const response = await axiosInstance.post<ApiResponse<GenerateQuizResponse>>(
        "/ai/quiz/generate",
        request,
    );
    return response.data.result;
};

export default {
    summarizeExtractionFile,
    generateQuiz,
}