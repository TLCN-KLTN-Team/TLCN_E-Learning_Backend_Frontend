import axiosInstance from "../httpClient/axiosInstance";
import type { CourseClassRequest } from "../request/courseClassRequest";
import type { ApiResponse, PaginatedResponse } from "../response/apiResponse";
import type { CourseClassResponse } from "../response/courseClassResponse";
import type { StudentResponse } from "../response/studentResponse";

export const createClass = async (
  educationalUnitId: string,
  classData: CourseClassRequest
): Promise<CourseClassResponse> => {
  const response = await axiosInstance.post<ApiResponse<CourseClassResponse>>(
    `/course-management/admin/educationalUnit/${educationalUnitId}/classes`,
    classData
  );
  return response.data.result;
};

export const getClassesByEducationalUnit = async (
  educationalUnitId: string,
  page: number = 0,
  size: number = 20,
  search?: string
): Promise<PaginatedResponse<CourseClassResponse>> => {
  const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
  const response = await axiosInstance.get<ApiResponse<PaginatedResponse<CourseClassResponse>>>(
    `/course-management/admin/educationalUnit/${educationalUnitId}/classes?page=${page}&size=${size}${searchParam}`
  );
  return response.data.result;
};

export const getClassesByCourse = async (
  educationalUnitId: string,
  courseId: number,
  page: number = 0,
  size: number = 20
): Promise<PaginatedResponse<CourseClassResponse>> => {
  const response = await axiosInstance.get<ApiResponse<PaginatedResponse<CourseClassResponse>>>(
    `/course-management/admin/educationalUnit/${educationalUnitId}/courses/${courseId}/classes?page=${page}&size=${size}`
  );
  return response.data.result;
};

export const updateClass = async (
  educationalUnitId: string,
  classId: number,
  classData: Partial<CourseClassRequest>
): Promise<CourseClassResponse> => {
  const response = await axiosInstance.put<ApiResponse<CourseClassResponse>>(
    `/course-management/admin/educationalUnit/${educationalUnitId}/classes/${classId}`,
    classData
  );
  return response.data.result;
};

export const deleteClass = async (
  educationalUnitId: string,
  classId: number
): Promise<void> => {
  await axiosInstance.delete(
    `/course-management/admin/educationalUnit/${educationalUnitId}/classes/${classId}`
  );
};

// --- Class enrollment functions ---
export const enrollStudentsToClass = async (
  educationalUnitId: string,
  classId: number,
  studentIds: string[]
): Promise<void> => {
  await axiosInstance.post(
    `/course-management/admin/educationalUnit/${educationalUnitId}/classes/${classId}/enroll-students`,
    studentIds
  );
};

export const getStudentsInClass = async (
  educationalUnitId: string,
  classId: number
): Promise<StudentResponse[]> => {
  const response = await axiosInstance.get<ApiResponse<StudentResponse[]>>(
    `/course-management/admin/educationalUnit/${educationalUnitId}/classes/${classId}/students`
  );
  return response.data.result;
};

export const getAvailableStudentsForClass = async (
  educationalUnitId: string,
  classId: number
): Promise<StudentResponse[]> => {
  const response = await axiosInstance.get<ApiResponse<StudentResponse[]>>(
    `/course-management/admin/educationalUnit/${educationalUnitId}/classes/${classId}/available-students`
  );
  return response.data.result;
};

export const unenrollStudentFromClass = async (
  educationalUnitId: string,
  classId: number,
  studentId: string
): Promise<void> => {
  await axiosInstance.delete(
    `/course-management/admin/educationalUnit/${educationalUnitId}/classes/${classId}/students/${studentId}`
  );
};