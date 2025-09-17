import axiosInstance from "../httpClient/axiosInstance";
import type { TeacherRequest } from "../request/teacherRequest";
import type { ApiResponse, PaginatedResponse } from "../response/apiResponse";
import type { TeacherResponse } from "../response/teacherResponse";

export const createTeacher = async (
  institutionId: string,
  teacherData: TeacherRequest
): Promise<TeacherResponse> => {
  try {
    const response = await axiosInstance.post<ApiResponse<TeacherResponse>>(
      `/course-management/admin/institutions/${institutionId}/teachers`,
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
  institutionId: string,
  page: number = 0,
  size: number = 20
): Promise<PaginatedResponse<TeacherResponse>> => {
  const response = await axiosInstance.get<ApiResponse<PaginatedResponse<TeacherResponse>>>(
    `/course-management/admin/institutions/${institutionId}/teachers?page=${page}&size=${size}`
  );
  console.log("📌 Backend trả về:", response.data);
  console.log("📌 result:", response.data.result);
  return response.data.result;
};

export const updateTeacher = async (
  institutionId: string,
  teacherId: string,
  teacherData: Partial<TeacherRequest>
): Promise<TeacherResponse> => {
  const response = await axiosInstance.put<ApiResponse<TeacherResponse>>(
    `/course-management/admin/institutions/${institutionId}/teachers/${teacherId}`,
    teacherData
  );
  return response.data.result;
};

export const deleteTeacher = async (
  institutionId: string,
  teacherId: string
): Promise<void> => {
  await axiosInstance.delete(
    `/course-management/admin/institutions/${institutionId}/teachers/${teacherId}`
  );
};