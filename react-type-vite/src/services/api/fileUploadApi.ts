import type { AttachmentResponse } from "@/types/chat.types";
import axiosInstance from "./httpClient/axiosInstance";
import type { ApiResponse } from "./response/apiResponse";

export const uploadMultipleFiles = async (
  formData: FormData
): Promise<AttachmentResponse[]> => {
  const response = await axiosInstance.post<ApiResponse<AttachmentResponse[]>>(
    `/server/files/upload-multiple`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data.result;
};
