import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { toast } from 'react-toastify';
import * as adminApi from '@/services/api/adminApi';

// Types matching backend
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

export interface AdminContextType {
  // Institution functions
  getMyInstitution: () => Promise<EducationalUnitResponse>;
  currentInstitution: EducationalUnitResponse | null;
  institutionId: string | null;
  
  // Student functions
  createStudent: (studentData: StudentRequest) => Promise<StudentResponse>;
  getStudents: (page?: number, size?: number) => Promise<PaginatedResponse<StudentResponse>>;
  updateStudent: (studentId: string, studentData: Partial<StudentRequest>) => Promise<StudentResponse>;
  deleteStudent: (studentId: string) => Promise<void>;
  
  // Teacher functions
  createTeacher: (teacherData: TeacherRequest) => Promise<TeacherResponse>;
  getTeachers: (page?: number, size?: number) => Promise<PaginatedResponse<TeacherResponse>>;
  updateTeacher: (teacherId: string, teacherData: Partial<TeacherRequest>) => Promise<TeacherResponse>;
  deleteTeacher: (teacherId: string) => Promise<void>;
  
  // Course functions
  createCourse: (courseData: CourseRequest) => Promise<CourseResponse>;
  getCourses: (page?: number, size?: number) => Promise<PaginatedResponse<CourseResponse>>;
  assignTeacherToCourse: (courseId: number, teacherId: string) => Promise<CourseResponse>;
  removeTeacherFromCourse: (courseId: number) => Promise<CourseResponse>;
  enrollStudentsToCourse: (courseId: number, studentIds: string[]) => Promise<void>;
  updateCourse: (courseId: number, courseData: Partial<CourseRequest>) => Promise<CourseResponse>;
  deleteCourse: (courseId: number) => Promise<void>;
  
  // Course Type functions
  getCourseTypes: (page?: number, size?: number, search?: string) => Promise<PaginatedResponse<CourseTypeResponse>>;
  
  // Department functions
  getDepartmentsByInstitution: (page?: number, size?: number, search?: string) => Promise<PaginatedResponse<DepartmentResponse>>;
  // Loading state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  
  // Institution loading state
  isInstitutionLoading: boolean;
}

export const AdminContext = createContext<AdminContextType | undefined>(undefined);

interface AdminProviderProps {
  children: ReactNode;
}

export const AdminProvider: React.FC<AdminProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isInstitutionLoading, setIsInstitutionLoading] = useState(true);
  const [currentInstitution, setCurrentInstitution] = useState<EducationalUnitResponse | null>(null);
  const [institutionId, setInstitutionId] = useState<string | null>(null);

  // Initialize institution data
  useEffect(() => {
    const initializeInstitution = async () => {
      try {
        setIsInstitutionLoading(true);
        const institution = await adminApi.getMyInstitution();
        setCurrentInstitution(institution);
        setInstitutionId(institution.id);
      } catch (error: any) {
        console.error('Failed to load institution:', error);
        toast.error('Failed to load institution data');
      } finally {
        setIsInstitutionLoading(false);
      }
    };

    initializeInstitution();
  }, []);

  // Helper function to handle API calls with loading and error handling
  const handleApiCall = async <T,>(
    apiCall: () => Promise<T>,
    successMessage?: string,
    errorMessage?: string
  ): Promise<T> => {
    try {
      setIsLoading(true);
      const result = await apiCall();
      if (successMessage) {
        toast.success(successMessage);
      }
      return result;
    } catch (error: any) {
      const message = errorMessage || error?.response?.data?.message || 'An error occurred';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Institution functions
  const getMyInstitution = async (): Promise<EducationalUnitResponse> => {
    return handleApiCall(
      () => adminApi.getMyInstitution(),
      undefined,
      'Failed to fetch institution data'
    );
  };

  // Student functions (now using institutionId from context)
  const createStudent = async (studentData: StudentRequest): Promise<StudentResponse> => {
    if (!institutionId) throw new Error('Institution ID not available');
    return handleApiCall(
      () => adminApi.createStudent(institutionId, studentData),
      'Student created successfully!',
      'Failed to create student'
    );
  };

  const getStudents = async (page?: number, size?: number): Promise<PaginatedResponse<StudentResponse>> => {
    if (!institutionId) throw new Error('Institution ID not available');
    return handleApiCall(
      () => adminApi.getStudents(institutionId, page, size),
      undefined,
      'Failed to fetch students'
    );
  };

  const updateStudent = async (studentId: string, studentData: Partial<StudentRequest>): Promise<StudentResponse> => {
    if (!institutionId) throw new Error('Institution ID not available');
    return handleApiCall(
      () => adminApi.updateStudent(institutionId, studentId, studentData),
      'Student updated successfully!',
      'Failed to update student'
    );
  };

  const deleteStudent = async (studentId: string): Promise<void> => {
    if (!institutionId) throw new Error('Institution ID not available');
    return handleApiCall(
      () => adminApi.deleteStudent(institutionId, studentId),
      'Student deleted successfully!',
      'Failed to delete student'
    );
  };

  // Teacher functions (now using institutionId from context)
  const createTeacher = async (teacherData: TeacherRequest): Promise<TeacherResponse> => {
    if (!institutionId) throw new Error('Institution ID not available');
    return handleApiCall(
      () => adminApi.createTeacher(institutionId, teacherData),
      'Teacher created successfully!',
      'Failed to create teacher'
    );
  };

  const getTeachers = async (page?: number, size?: number): Promise<PaginatedResponse<TeacherResponse>> => {
    if (!institutionId) throw new Error('Institution ID not available');
    return handleApiCall(
      () => adminApi.getTeachers(institutionId, page, size),
      undefined,
      'Failed to fetch teachers'
    );
  };

  const updateTeacher = async (teacherId: string, teacherData: Partial<TeacherRequest>): Promise<TeacherResponse> => {
    if (!institutionId) throw new Error('Institution ID not available');
    return handleApiCall(
      () => adminApi.updateTeacher(institutionId, teacherId, teacherData),
      'Teacher updated successfully!',
      'Failed to update teacher'
    );
  };

  const deleteTeacher = async (teacherId: string): Promise<void> => {
    if (!institutionId) throw new Error('Institution ID not available');
    return handleApiCall(
      () => adminApi.deleteTeacher(institutionId, teacherId),
      'Teacher deleted successfully!',
      'Failed to delete teacher'
    );
  };

  // Course functions (now using institutionId from context)
  const createCourse = async (courseData: CourseRequest): Promise<CourseResponse> => {
  if (!institutionId) throw new Error('Institution ID not available');
  return handleApiCall(
    () => adminApi.createCourse(institutionId, courseData),
    'Course created successfully!',
    'Failed to create course'
  );
};

  const getCourses = async (page?: number, size?: number): Promise<PaginatedResponse<CourseResponse>> => {
    if (!institutionId) throw new Error('Institution ID not available');
    return handleApiCall(
      () => adminApi.getCourses(institutionId, page, size),
      undefined,
      'Failed to fetch courses'
    );
  };

  const assignTeacherToCourse = async (courseId: number, teacherId: string): Promise<CourseResponse> => {
    if (!institutionId) throw new Error('Institution ID not available');
    return handleApiCall(
      () => adminApi.assignTeacherToCourse(institutionId, courseId, teacherId),
      'Teacher assigned successfully!',
      'Failed to assign teacher'
    );
  };

  const removeTeacherFromCourse = async (courseId: number): Promise<CourseResponse> => {
    if (!institutionId) throw new Error('Institution ID not available');
    return handleApiCall(
      () => adminApi.removeTeacherFromCourse(institutionId, courseId),
      'Teacher removed successfully!',
      'Failed to remove teacher'
    );
  };

  const enrollStudentsToCourse = async (courseId: number, studentIds: string[]): Promise<void> => {
    if (!institutionId) throw new Error('Institution ID not available');
    return handleApiCall(
      () => adminApi.enrollStudentsToCourse(institutionId, courseId, studentIds),
      'Students enrolled successfully!',
      'Failed to enroll students'
    );
  };

  const updateCourse = async (courseId: number, courseData: Partial<CourseRequest>): Promise<CourseResponse> => {
    if (!institutionId) throw new Error('Institution ID not available');
    return handleApiCall(
      () => adminApi.updateCourse(institutionId, courseId, courseData),
      'Course updated successfully!',
      'Failed to update course'
    );
  };

  const deleteCourse = async (courseId: number): Promise<void> => {
    if (!institutionId) throw new Error('Institution ID not available');
    return handleApiCall(
      () => adminApi.deleteCourse(institutionId, courseId),
      'Course deleted successfully!',
      'Failed to delete course'
    );
  };
  // Course Type functions
const getCourseTypes = async (page?: number, size?: number, search?: string): Promise<PaginatedResponse<CourseTypeResponse>> => {
  return handleApiCall(
    () => adminApi.getCourseTypes(page, size, search),
    undefined,
    'Failed to fetch course types'
  );
};
// Department functions
const getDepartmentsByInstitution = async (page?: number, size?: number, search?: string): Promise<PaginatedResponse<DepartmentResponse>> => {
  if (!institutionId) throw new Error('Institution ID not available');
  return handleApiCall(
    () => adminApi.getDepartmentsByInstitution(institutionId, page, size, search),
    undefined,
    'Failed to fetch departments'
  );
};

  const value: AdminContextType = {
    // Institution
    getMyInstitution,
    currentInstitution,
    institutionId,
    
    // Student functions
    createStudent,
    getStudents,
    updateStudent,
    deleteStudent,
    
    // Teacher functions
    createTeacher,
    getTeachers,
    updateTeacher,
    deleteTeacher,
    
    // Course functions
    createCourse,
    getCourses,
    assignTeacherToCourse,
    removeTeacherFromCourse,
    enrollStudentsToCourse,
    updateCourse,
    deleteCourse,

    // Course Type functions
    getCourseTypes,
  
    // Department functions  
    getDepartmentsByInstitution,
    
    // Loading state
    isLoading,
    setIsLoading,
    isInstitutionLoading,
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = (): AdminContextType => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};