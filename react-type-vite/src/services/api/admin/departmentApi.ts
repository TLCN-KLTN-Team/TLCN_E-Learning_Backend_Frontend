import axiosInstance from "../httpClient/axiosInstance";
import type { ApiResponse, PaginatedResponse } from "../response/apiResponse";
import type { DepartmentResponse } from "../response/DepartmentResponse";

export const getDepartmentsByInstitution = async (
  institutionId: string,
  page: number = 0,
  size: number = 100,
  search?: string
): Promise<PaginatedResponse<DepartmentResponse>> => {
  const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
  const response = await axiosInstance.get<ApiResponse<PaginatedResponse<DepartmentResponse>>>(
    `/course-management/admin/institutions/${institutionId}/departments?page=${page}&size=${size}${searchParam}`
  );
  return response.data.result;
};