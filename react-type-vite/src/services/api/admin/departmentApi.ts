import axiosInstance from "../httpClient/axiosInstance";
import type { ApiResponse, PaginatedResponse } from "../response/apiResponse";
import type { DepartmentResponse } from "../response/departmentResponse";

export const getDepartmentsByEducationalUnit = async (
  educationalUnitId: number,
  page: number = 0,
  size: number = 100,
  search?: string
): Promise<PaginatedResponse<DepartmentResponse>> => {
  const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
  const response = await axiosInstance.get<ApiResponse<PaginatedResponse<DepartmentResponse>>>(
    `/course-management/admin/educationalUnit/${educationalUnitId}/departments?page=${page}&size=${size}${searchParam}`
  );
  return response.data.result;
};

export const createDepartment = async (
  educationalUnitId: number,
  data: {
    name: string;
    description?: string;
  }
): Promise<DepartmentResponse> => {
  const response = await axiosInstance.post<ApiResponse<DepartmentResponse>>(
    `/course-management/admin/educationalUnit/${educationalUnitId}/departments`,
    data
  );
  return response.data.result;
};

export const updateDepartment = async (
  educationalUnitId: number,
  departmentId: string,
  data: {
    name: string;
    description?: string;
  }
): Promise<DepartmentResponse> => {
  const response = await axiosInstance.put<ApiResponse<DepartmentResponse>>(
    `/course-management/admin/educationalUnit/${educationalUnitId}/departments/${departmentId}`,
    data
  );
  return response.data.result;
};

export const deleteDepartment = async (
  educationalUnitId: number,
  departmentId: string
): Promise<void> => {
  await axiosInstance.delete(
    `/course-management/admin/educationalUnit/${educationalUnitId}/departments/${departmentId}`
  );
};