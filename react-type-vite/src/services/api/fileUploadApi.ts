import type {
  ChatMessageResponse,
  MessageUpdatePayload,
} from "@/types/chat.types";
import axiosInstance from "./httpClient/axiosInstance";
import type { ApiResponse } from "./response/apiResponse";

export const uploadMultipleFiles = async (
  formData: FormData,
): Promise<MessageUpdatePayload> => {
  const response = await axiosInstance.post<ApiResponse<MessageUpdatePayload>>(
    `/server/files/upload-multiple`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data.result;
};

export const uploadFileOnlyMessage = async (
  formData: FormData,
): Promise<ChatMessageResponse> => {
  const response = await axiosInstance.post<ApiResponse<ChatMessageResponse>>(
    `/server/files/upload-file-only`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data.result;
};

export interface FileUploadResponse {
  url: string;
  publicId: string;
  originalFilename: string;
  format: string;
}

/**
 * Upload single image for discussion messages
 */
export const uploadImage = async (file: File): Promise<FileUploadResponse> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await axiosInstance.post<FileUploadResponse>(
    "/server/api/discussions/quiz/upload-image",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data;
};
