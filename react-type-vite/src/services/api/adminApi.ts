import type { ApiResponse } from "../../types/response/apiResponse";
import axiosInstance from "./httpClient/axiosInstance";

// Types matching your backend exactly
export interface StudentRequest {
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
  dob?: string;
  studentId: string;
  departmentId?: string;
  educationalUnitId: string;
  description?: string;
  socialUrl?: string;
  className?: string;
}

export interface StudentResponse {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  dob?: string;
  studentId: string;
  departmentId?: string;
  educationalUnitId?: string;
  description?: string;
  socialUrl?: string;
  className?: string;
  department?: DepartmentResponse;
  educationalUnit?: EducationalUnitResponse;
}

export interface TeacherRequest {
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
  dob?: string;
  teacherId: string;
  departmentId?: string;
  educationalUnitId: string;
  description?: string;
  socialUrl?: string;
  bankAccountNumber?: string;
}

export interface TeacherResponse {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  dob?: string;
  teacherId: string;
  departmentId?: string;
  educationalUnitId?: string;
  description?: string;
  socialUrl?: string;
  bankAccountNumber?: string;
  department?: DepartmentResponse;
  educationalUnit?: EducationalUnitResponse;
}

export interface CourseRequest {
  id?: number;
  courseName: string;
  courseTypeId: number;
  idTeacher?: string;
  description?: string;
  credits?: number;
  maxStudents?: number;
  createdAt?: Date;
  updateAt?: Date;
  sections?: any[];
}

export interface CourseResponse {
  id: number;
  courseName: string;
  description?: string;
  credits?: number;
  maxStudents?: number;
  currentStudents?: number;
  courseType?: CourseTypeResponse;
  createdAt?: Date;
  updatedAt?: Date;
  idTeacher?: string;
  teacher?: TeacherResponse;
  institution?: EducationalUnitResponse;
  sections?: any[];
}

export interface CourseTypeResponse {
  id: number;
  courseTypeName: string;
}

export interface DepartmentResponse {
  id: string;
  name: string;
  description?: string;
}

export interface EducationalUnitResponse {
  id: string;
  name: string;
  type?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo?: string;
  description?: string;
  establishedYear?: number;
  isActive?: boolean;
  idAdmin?: string;
  subscriptionStartDate?: Date;
  subscriptionEndDate?: Date;
  createdAt?: Date;
  totalDepartments?: number;
  totalCourses?: number;
  totalTeachers?: number;
  totalStudents?: number;
  departments?: Set<DepartmentResponse>;
  courses?: Set<CourseResponse>;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

// --- Institution API Functions ---
export const getMyInstitution = async (): Promise<EducationalUnitResponse> => {
  const response = await axiosInstance.get<ApiResponse<EducationalUnitResponse>>(
    `/course-management/educational-unit/my-institution`
  );
  return response.data.result;
};

// --- Student API Functions ---
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

// --- Teacher API Functions ---
export const createTeacher = async (
  institutionId: string,
  teacherData: TeacherRequest
): Promise<TeacherResponse> => {
  const response = await axiosInstance.post<ApiResponse<TeacherResponse>>(
    `/course-management/admin/institutions/${institutionId}/teachers`,
    teacherData
  );
  return response.data.result;
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

// --- Course API Functions ---
export const createCourse = async (
  institutionId: string,
  courseData: CourseRequest
): Promise<CourseResponse> => {
  const response = await axiosInstance.post<ApiResponse<CourseResponse>>(
    `/course-management/admin/institutions/${institutionId}/courses`,
    courseData
  );
  return response.data.result;
};

export const getCourses = async (
  institutionId: string,
  page: number = 0,
  size: number = 20
): Promise<PaginatedResponse<CourseResponse>> => {
  const response = await axiosInstance.get<ApiResponse<PaginatedResponse<CourseResponse>>>(
    `/course-management/admin/institutions/${institutionId}/courses?page=${page}&size=${size}`
  );
  console.log("Calling:", axiosInstance.defaults.baseURL + "/courses");
  return response.data.result;
};

export const assignTeacherToCourse = async (
  institutionId: string,
  courseId: number,
  teacherId: string
): Promise<CourseResponse> => {
  console.log('API call - assignTeacherToCourse:', { institutionId, courseId, teacherId });
  const response = await axiosInstance.put<ApiResponse<CourseResponse>>(
    `/course-management/admin/institutions/${institutionId}/courses/${courseId}/assign-teacher?teacherId=${teacherId}`
  );
  return response.data.result;
};

export const removeTeacherFromCourse = async (
  institutionId: string,
  courseId: number
): Promise<CourseResponse> => {
  const response = await axiosInstance.put<ApiResponse<CourseResponse>>(
    `/course-management/admin/institutions/${institutionId}/courses/${courseId}/remove-teacher`
  );
  return response.data.result;
};

export const enrollStudentsToCourse = async (
  institutionId: string,
  courseId: number,
  studentIds: string[]
): Promise<void> => {
  await axiosInstance.post(
    `/course-management/admin/institutions/${institutionId}/courses/${courseId}/enroll-students`,
    studentIds
  );
};

export const updateCourse = async (
  institutionId: string,
  courseId: number,
  courseData: Partial<CourseRequest>
): Promise<CourseResponse> => {
  const response = await axiosInstance.put<ApiResponse<CourseResponse>>(
    `/course-management/admin/institutions/${institutionId}/courses/${courseId}`,
    courseData
  );
  return response.data.result;
};

export const deleteCourse = async (
  institutionId: string,
  courseId: number
): Promise<void> => {
  await axiosInstance.delete(
    `/course-management/admin/institutions/${institutionId}/courses/${courseId}`
  );
};

// --- Course Type API Functions ---
export const getCourseTypes = async (
  page: number = 0,
  size: number = 100,
  search?: string
): Promise<PaginatedResponse<CourseTypeResponse>> => {
  const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
  const response = await axiosInstance.get<ApiResponse<PaginatedResponse<CourseTypeResponse>>>(
    `/course-management/course-types?page=${page}&size=${size}${searchParam}`
  );
  return response.data.result;
};

// --- Department API Functions ---
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