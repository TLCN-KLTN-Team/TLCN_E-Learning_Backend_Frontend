// Educational Unit Types

export interface EducationalUnit {
  id: string;
  name: string;
  logo?: string;
  bannerImage?: string;
  address: string;
  establishedYear: number;
  totalStudents: number;
  description: string;
  specializations: string[];
  trainingPrograms: string[];
  email?: string;
  phone?: string;
  website?: string;
  isFollowing?: boolean;
}

export interface Teacher {
  id: string;
  name: string;
  avatar?: string;
  department: string;
  email?: string;
  title?: string;
  bio?: string;
}

export interface UnitCourse {
  id: string;
  title: string;
  description: string;
  duration: string;
  price: number;
  teacher: string;
  thumbnail?: string;
  enrollmentCount?: number;
  rating?: number;
  category?: string;
  level?: string;
}

export interface TeacherFilters {
  searchTerm: string;
  department: string;
}

export interface CourseFilters {
  sortBy: "newest" | "popular" | "price-low" | "price-high";
}

// Home Page API Response Types
export interface EducationalUnitCardResponse {
  id: number;
  name: string;
  address: string;
  type: string;
  logo: string;
  establishedYear: number;
  departments: string[];
}

// Educational Unit Detail Response
export interface EducationalUnitDetailResponse {
  id: number;
  name: string;
  type?: string;
  address: string;
  phone?: string;
  email?: string;
  website?: string;
  logo: string;
  description?: string;
  establishedYear: number;
  totalDepartments?: number;
  totalCourses?: number;
  totalTeachers?: number;
  totalStudents?: number;
  representativeName?: string;
  representativeEmail?: string;
  representativePhone?: string;
  teachers: EducationalUnitTeacher[];
  courses: EducationalUnitCourse[];
}

export interface EducationalUnitTeacher {
  id: string;
  avatarUrl?: string;
  academicDegree?: string;
  name: string;
  departmentName: string;
}

export interface EducationalUnitCourse {
  id: number;
  name: string;
  description?: string;
  departmentName?: string;
  coverImageUrl?: string;
  duration: number;
  numberOfStudents: number;
  averageRating: number;
  price: string;
}
