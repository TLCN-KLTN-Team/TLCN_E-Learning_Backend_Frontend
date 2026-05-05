export interface CourseClassResponse {
  id: number;
  className: string;
  classCode: string;
  courseId: number;
  courseName: string;
  maxStudents: number;
  currentStudents: number;
  startDate?: Date;
  endDate?: Date;
  status: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
  isArchived?: boolean;
  archivedAt?: Date;
}