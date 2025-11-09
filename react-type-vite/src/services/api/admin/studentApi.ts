
import type { StudentResponse } from "../response/studentResponse";
import type { StudentRequest } from "../request/studentRequest";
import type { ApiResponse, PaginatedResponse } from "../response/apiResponse";
import axiosInstance from "../httpClient/axiosInstance";

export const createStudent = async (
  educationalUnitId: number,
  studentData: StudentRequest
): Promise<StudentResponse> => {
  const response = await axiosInstance.post<ApiResponse<StudentResponse>>(
    `/course-management/admin/educationalUnit/${educationalUnitId}/students`,
    studentData
  );
  return response.data.result;
};

export const getStudents = async (
  educationalUnitId: number,
  page: number = 0,
  size: number = 20
): Promise<PaginatedResponse<StudentResponse>> => {
  const response = await axiosInstance.get<ApiResponse<PaginatedResponse<StudentResponse>>>(
    `/course-management/admin/educationalUnit/${educationalUnitId}/students?page=${page}&size=${size}`
  );
  return response.data.result;
};

export const updateStudent = async (
  educationalUnitId: number,
  studentId: string,
  studentData: Partial<StudentRequest>
): Promise<StudentResponse> => {
  const response = await axiosInstance.put<ApiResponse<StudentResponse>>(
    `/course-management/admin/educationalUnit/${educationalUnitId}/students/${studentId}`,
    studentData
  );
  return response.data.result;
};

export const updateStudentAccountStatus = async (
  educationalUnitId: number,
  studentId: string,
  status: string
): Promise<StudentResponse> => {
  const response = await axiosInstance.put<ApiResponse<StudentResponse>>(
    `/course-management/admin/educationalUnit/${educationalUnitId}/students/${studentId}/status?status=${status}`
  );
  return response.data.result;
};

export const deleteStudent = async (
  educationalUnitId: number,
  studentId: string
): Promise<void> => {
  await axiosInstance.delete(
    `/course-management/admin/educationalUnit/${educationalUnitId}/students/${studentId}`
  );
};

export const getAllStudents = async (): Promise<StudentResponse[]> => {
  const response = await axiosInstance.get<ApiResponse<StudentResponse[]>>(`/course-management/admin/students/all`)
  return response.data.result
}