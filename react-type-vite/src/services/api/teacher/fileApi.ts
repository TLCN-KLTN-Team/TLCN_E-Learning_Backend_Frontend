import axiosInstance from "../httpClient/axiosInstance"
import type { ApiResponse } from "../response/apiResponse"

interface UploadResponse {
  url: string
  fileName: string
  fileSize: number
  contentType: string
}

const fileApi = {
  /**
   * Upload a single file
   */
  uploadFile: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData()
    formData.append("file", file)

    const response = await axiosInstance.post<ApiResponse<UploadResponse>>(
      "/file-handler/media/upload",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    )

    return response.data.result
  },

  /**
   * Upload multiple files
   */
  uploadMultipleFiles: async (files: File[]): Promise<UploadResponse[]> => {
    const uploadPromises = files.map((file) => fileApi.uploadFile(file))
    return Promise.all(uploadPromises)
  },
}

export default fileApi