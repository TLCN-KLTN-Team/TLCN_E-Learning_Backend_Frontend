import type { SectionRequest } from "./sectionRequest";

export interface CourseRequest {
  id?: number;
  courseName: string;
  idTeacher?: string;
  description?: string;
  credits?: number;
  maxStudents?: number;
  createdAt?: Date;
  updateAt?: Date;
  sections?: SectionRequest[];
}