export interface TeacherRequest {
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
  dob?: string;
  teacherId: string;
  departmentId?: string;
  educationalUnitId: string;
  description?: string;
  socialUrl?: string;
  bankAccountNumber?: string;
}