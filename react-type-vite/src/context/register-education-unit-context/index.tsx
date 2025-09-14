"use client"

import type React from "react"
import { createContext, useContext, useState } from "react"
import type { ReactNode } from "react"
import { toast } from "react-toastify"
import * as educationUnitApi from "../../services/api/registerEducationUnitApi"

export interface EducationUnitContextType {
  // Registration functions
  registerEducationUnit: (
    registrationData: educationUnitApi.EducationUnitRegistrationRequest,
    logo?: File,
    businessLicense?: File
  ) => Promise<educationUnitApi.EducationUnitRegistrationResponse>
  
  uploadLogo: (educationUnitId: string, file: File) => Promise<string>
  uploadBusinessLicense: (educationUnitId: string, file: File) => Promise<string>
  getEducationUnit: (id: string) => Promise<educationUnitApi.EducationUnitRegistrationResponse>

  // Loading state
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

export const EducationUnitContext = createContext<EducationUnitContextType | undefined>(undefined)

interface EducationUnitProviderProps {
  children: ReactNode
}

export const EducationUnitProvider: React.FC<EducationUnitProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false)

  // Helper function to handle API calls with loading and error handling
  const handleApiCall = async <T,>(
    apiCall: () => Promise<T>,
    successMessage?: string,
    errorMessage?: string,
  ): Promise<T> => {
    try {
      setIsLoading(true)
      const result = await apiCall()
      if (successMessage) {
        toast.success(successMessage)
      }
      return result
    } catch (error: any) {
      const message = errorMessage || error?.response?.data?.message || "An error occurred"
      toast.error(message)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Registration function - updated to handle files in single call
  const registerEducationUnit = async (
    registrationData: educationUnitApi.EducationUnitRegistrationRequest,
    logo?: File,
    businessLicense?: File
  ): Promise<educationUnitApi.EducationUnitRegistrationResponse> => {
    return handleApiCall(
      () => educationUnitApi.registerEducationUnit(registrationData, logo, businessLicense),
      "Đăng ký đơn vị đào tạo thành công!",
      "Đăng ký đơn vị đào tạo thất bại",
    )
  }

  const uploadLogo = async (educationUnitId: string, file: File): Promise<string> => {
    return handleApiCall(
      () => educationUnitApi.uploadLogo(educationUnitId, file),
      "Tải lên logo thành công!",
      "Tải lên logo thất bại",
    )
  }

  const uploadBusinessLicense = async (educationUnitId: string, file: File): Promise<string> => {
    return handleApiCall(
      () => educationUnitApi.uploadBusinessLicense(educationUnitId, file),
      "Tải lên giấy phép hoạt động thành công!",
      "Tải lên giấy phép hoạt động thất bại",
    )
  }

  const getEducationUnit = async (id: string): Promise<educationUnitApi.EducationUnitRegistrationResponse> => {
    return handleApiCall(
      () => educationUnitApi.getEducationUnit(id),
      undefined,
      "Không thể lấy thông tin đơn vị đào tạo",
    )
  }

  const value: EducationUnitContextType = {
    registerEducationUnit,
    uploadLogo,
    uploadBusinessLicense,
    getEducationUnit,
    isLoading,
    setIsLoading,
  }

  return <EducationUnitContext.Provider value={value}>{children}</EducationUnitContext.Provider>
}

export const useEducationUnit = (): EducationUnitContextType => {
  const context = useContext(EducationUnitContext)
  if (context === undefined) {
    throw new Error("useEducationUnit must be used within a EducationUnitProvider")
  }
  return context
}