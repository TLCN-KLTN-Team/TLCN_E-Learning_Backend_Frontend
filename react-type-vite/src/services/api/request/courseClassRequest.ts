export interface CourseClassRequest {
  className: string;
  classCode: string;
  courseId: number;
  maxStudents: number;
  startDate?: Date;
  endDate?: Date;
  description?: string;
}