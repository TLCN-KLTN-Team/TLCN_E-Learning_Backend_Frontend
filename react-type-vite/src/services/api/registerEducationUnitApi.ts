import axiosInstance from "./httpClient/axiosInstance"
import type { EducationUnitRegistrationRequest } from "./request/educationUnitRegistrationRequest"
import type { ApiResponse } from "./response/apiResponse"
import type { EducationUnitRegistrationResponse } from "./response/educationUnitRegistrationResponse"


// Updated to match backend multipart form data approach
export const registerEducationUnit = async (
  registrationData: EducationUnitRegistrationRequest,
  logo?: File,
  businessLicenseSigned?: File,
): Promise<EducationUnitRegistrationResponse> => {
  const formData = new FormData()
  
  // Add JSON data as a blob
  const dataBlob = new Blob([JSON.stringify(registrationData)], {
    type: 'application/json'
  })
  formData.append('data', dataBlob)
  
  // Add files if provided
  if (logo) {
    formData.append('logo', logo)
  }
  
  if (businessLicenseSigned) {
    formData.append('businessLicenseSigned', businessLicenseSigned)
  }

  const response = await axiosInstance.post<ApiResponse<EducationUnitRegistrationResponse>>(
    "/course-management/educational-unit/register",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  )
  return response.data.result
}

// Separate upload functions for individual file uploads
export const uploadLogo = async (educationUnitId: string, file: File): Promise<string> => {
  const formData = new FormData()
  formData.append("file", file)

  const response = await axiosInstance.post<ApiResponse<string>>(
    `/course-management/educational-unit/${educationUnitId}/upload-logo`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  )

  return response.data.result
}

export const uploadBusinessLicense = async (educationUnitId: string, file: File): Promise<string> => {
  const formData = new FormData()
  formData.append("file", file)

  const response = await axiosInstance.post<ApiResponse<string>>(
    `/course-management/educational-unit/${educationUnitId}/upload-business-license`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  )

  return response.data.result
}

export const getEducationUnit = async (id: string): Promise<EducationUnitRegistrationResponse> => {
  const response = await axiosInstance.get<ApiResponse<EducationUnitRegistrationResponse>>(
    `/course-management/educational-unit/${id}`
  )
  return response.data.result
}