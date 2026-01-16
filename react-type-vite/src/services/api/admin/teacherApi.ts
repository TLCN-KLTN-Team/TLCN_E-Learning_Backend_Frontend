import axiosInstance from "../httpClient/axiosInstance";
import type { TeacherRequest } from "../request/teacherRequest";
import type { ApiResponse, PaginatedResponse } from "../response/apiResponse";
import type { TeacherResponse } from "../response/teacherResponse";

export const createTeacher = async (
  educationalUnitId: number,
  teacherData: TeacherRequest
): Promise<TeacherResponse> => {
  try {
    const response = await axiosInstance.post<ApiResponse<TeacherResponse>>(
      `/course-management/admin/educationalUnit/${educationalUnitId}/teachers`,
      teacherData
    );
    return response.data.result;
  } catch (error: any) {
    // Log error for debugging
    console.error('Teacher API Error:', error);
    
    // Re-throw the original error to preserve its structure
    // The React component will handle extracting the message
    throw error;
  }
};

export const getTeachers = async (
  educationalUnitId: number,
  page: number = 0,
  size: number = 20,
  search?: string
): Promise<PaginatedResponse<TeacherResponse>> => {
  let url = `/course-management/admin/educationalUnit/${educationalUnitId}/teachers?page=${page}&size=${size}`;
  if (search && search.trim()) {
    url += `&search=${encodeURIComponent(search.trim())}`;
  }
  const response = await axiosInstance.get<ApiResponse<PaginatedResponse<TeacherResponse>>>(url);
  console.log("📌 Backend trả về:", response.data);
  console.log("📌 result:", response.data.result);
  return response.data.result;
};

export const updateTeacher = async (
  educationalUnitId: number,
  teacherId: string,
  teacherData: Partial<TeacherRequest>
): Promise<TeacherResponse> => {
  const response = await axiosInstance.put<ApiResponse<TeacherResponse>>(
    `/course-management/admin/educationalUnit/${educationalUnitId}/teachers/${teacherId}`,
    teacherData
  );
  return response.data.result;
};

export const updateTeacherAccountStatus = async (
  educationalUnitId: number,
  teacherId: string,
  status: string
): Promise<TeacherResponse> => {
  const response = await axiosInstance.put<ApiResponse<TeacherResponse>>(
    `/course-management/admin/educationalUnit/${educationalUnitId}/teachers/${teacherId}/status?status=${status}`
  );
  return response.data.result;
};

export const deleteTeacher = async (
  educationalUnitId: number,
  teacherId: string
): Promise<void> => {
  await axiosInstance.delete(
    `/course-management/admin/educationalUnit/${educationalUnitId}/teachers/${teacherId}`
  );
};

/**
 * Bulk import teachers
 */
export interface BulkImportResult {
  successful: number;
  failed: number;
     results: {
    username: string;
    success: boolean;
    message?: string;
  }[];
}

export const bulkImportTeachers = async (
  educationalUnitId: number,
  teachers: TeacherRequest[]
): Promise<BulkImportResult> => {
  try {
    const response = await axiosInstance.post<ApiResponse<BulkImportResult>>(
      `/course-management/admin/educationalUnit/${educationalUnitId}/teachers/bulk-import`,
      { teachers }
    );
    return response.data.result;
  } catch (error: any) {
    console.error("Bulk import error:", error);
    throw error;
  }
};