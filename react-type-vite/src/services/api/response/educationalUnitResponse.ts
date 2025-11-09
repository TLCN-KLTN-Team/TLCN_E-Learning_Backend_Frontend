import type { CourseResponse } from "./courseResponse";
import type { DepartmentResponse } from "./departmentResponse";


export interface EducationalUnitResponse {
  id: number;
  name: string;
  type?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo?: string;
  businessLicense?: string;
  description?: string;
  establishedYear?: number;
  status: string;
  subscriptionStartDate?: Date;
  subscriptionEndDate?: Date;
  createdAt?: Date;
  totalDepartments?: number;
  totalCourses?: number;
  totalTeachers?: number;
  totalStudents?: number;
  departments?: Set<DepartmentResponse>;
  courses?: Set<CourseResponse>;

  // Representative information
  representativeName?: string;
  representativeEmail?: string;
  representativePhone?: string;
}
