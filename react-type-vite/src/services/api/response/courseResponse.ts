import type { CourseCategoryResponse } from "./courseTypeResponse";
import type { EducationalUnitResponse } from "./educationalUnitResponse";
import type { TeacherResponse } from "./teacherResponse";

export interface CourseResponse {
  id: number;
  courseName: string;
  description?: string;
  credits?: number;
  maxStudents?: number;
  currentStudents?: number;
  courseType?: CourseCategoryResponse;
  createdAt?: Date;
  updatedAt?: Date;
  idTeacher?: string;
  teacher?: TeacherResponse;
  institution?: EducationalUnitResponse;
  sections?: any[];
}