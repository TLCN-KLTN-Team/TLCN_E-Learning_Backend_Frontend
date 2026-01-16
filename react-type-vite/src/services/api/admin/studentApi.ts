
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
  size: number = 20,
  search?: string
): Promise<PaginatedResponse<StudentResponse>> => {
  let url = `/course-management/admin/educationalUnit/${educationalUnitId}/students?page=${page}&size=${size}`;
  if (search && search.trim()) {
    url += `&search=${encodeURIComponent(search.trim())}`;
  }
  const response = await axiosInstance.get<ApiResponse<PaginatedResponse<StudentResponse>>>(url);
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

export const bulkImportStudents = async (
  educationalUnitId: number,
  students: StudentRequest[]
): Promise<{ successful: number; failed: number; results: any[] }> => {
  const response = await axiosInstance.post<ApiResponse<{ successful: number; failed: number; results: any[] }>>(
    `/course-management/admin/educationalUnit/${educationalUnitId}/students/bulk-import`,
    { students }
  );
  return response.data.result;
};
