import type { EducationalUnitResponse } from "./educationalUnitResponse";
import type { TeacherResponse } from "./teacherResponse";

export interface CourseResponse {
  id: number;
  courseName: string;
  description?: string;
  credits?: number;
  maxStudents?: number;
  currentStudents?: number;
  createdAt?: Date;
  updatedAt?: Date;
  idTeacher?: string;
  teacher?: TeacherResponse;
  institution?: EducationalUnitResponse;
  sections?: any[];
}