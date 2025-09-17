
import type { StudentResponse } from "../response/studentResponse";
import type { StudentRequest } from "../request/studentRequest";
import type { ApiResponse, PaginatedResponse } from "../response/apiResponse";
import axiosInstance from "../httpClient/axiosInstance";

export const createStudent = async (
  institutionId: string,
  studentData: StudentRequest
): Promise<StudentResponse> => {
  const response = await axiosInstance.post<ApiResponse<StudentResponse>>(
    `/course-management/admin/institutions/${institutionId}/students`,
    studentData
  );
  return response.data.result;
};

export const getStudents = async (
  institutionId: string,
  page: number = 0,
  size: number = 20
): Promise<PaginatedResponse<StudentResponse>> => {
  const response = await axiosInstance.get<ApiResponse<PaginatedResponse<StudentResponse>>>(
    `/course-management/admin/institutions/${institutionId}/students?page=${page}&size=${size}`
  );
  return response.data.result;
};

export const updateStudent = async (
  institutionId: string,
  studentId: string,
  studentData: Partial<StudentRequest>
): Promise<StudentResponse> => {
  const response = await axiosInstance.put<ApiResponse<StudentResponse>>(
    `/course-management/admin/institutions/${institutionId}/students/${studentId}`,
    studentData
  );
  return response.data.result;
};

export const deleteStudent = async (
  institutionId: string,
  studentId: string
): Promise<void> => {
  await axiosInstance.delete(
    `/course-management/admin/institutions/${institutionId}/students/${studentId}`
  );
};