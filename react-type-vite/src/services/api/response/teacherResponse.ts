import type { DepartmentResponse } from "./departmentResponse";
import type { EducationalUnitResponse } from "./educationalUnitResponse";

export interface TeacherResponse {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  dob?: string;
  teacherId: string;
  departmentId?: string;
  educationalUnitId?: string;
  description?: string;
  avatarUrl?: string;
  bankAccountNumber?: string;
  department?: DepartmentResponse;
  educationalUnit?: EducationalUnitResponse;
  accountStatus: string
}