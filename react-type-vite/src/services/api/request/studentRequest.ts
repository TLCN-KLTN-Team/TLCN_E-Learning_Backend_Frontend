export interface StudentRequest {
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
  dob?: string;
  studentId: string;
  departmentId?: string;
  educationalUnitId: number;
  description?: string;
  socialUrl?: string;
  className?: string;
}