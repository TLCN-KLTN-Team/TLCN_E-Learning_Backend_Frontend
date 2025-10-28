import type { DepartmentResponse } from "./departmentResponse";
import type { EducationalUnitResponse } from "./educationalUnitResponse";

export interface StudentResponse {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  dob?: string;
  studentId: string;
  departmentId?: string;
  educationalUnitId?: string;
  description?: string;
  socialUrl?: string;
  className?: string;
  department?: DepartmentResponse;
  educationalUnit?: EducationalUnitResponse;
  submittedAssignments: number
  totalAssignments: number
  completedQuizzes: number
  totalQuizzes: number
  averageScore: number
  lastAccessTime?: Date
  totalLearningHours: number
  enrollmentDate?: Date
  accountStatus: string
}