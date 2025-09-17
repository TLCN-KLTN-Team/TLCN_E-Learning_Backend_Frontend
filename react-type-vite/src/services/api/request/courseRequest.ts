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