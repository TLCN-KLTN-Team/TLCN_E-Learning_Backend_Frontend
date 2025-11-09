export interface TeacherRequest {
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
  dob?: string;
  teacherId: string;
  departmentId?: string;
  educationalUnitId: number;
  description?: string;
  socialUrl?: string;
  bankAccountNumber?: string;
}