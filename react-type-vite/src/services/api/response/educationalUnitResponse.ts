import type { CourseResponse } from "./courseResponse";
import type { DepartmentResponse } from "./DepartmentResponse";

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