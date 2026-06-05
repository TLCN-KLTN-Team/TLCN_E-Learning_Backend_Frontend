import axiosInstance from "../httpClient/axiosInstance";
import type { EducationalUnitRequest } from "../request/educationUnitRequest";
import type { ApiResponse } from "../response/apiResponse";
import type { EducationalUnitResponse } from "../response/educationalUnitResponse";
import type { DepartmentStatResponse } from "../response/departmentStatResponse";
import type { RecentActivityResponse } from "../response/recentActivityResponse";

const PREFIX = "/course-management/educational-unit";

export const getMyEducationalUnit = async (): Promise<EducationalUnitResponse> => {
  const response = await axiosInstance.get<ApiResponse<EducationalUnitResponse>>(
    `${PREFIX}/my-educationalUnit`
  );
  return response.data.result;
};

export const getInternalStudentRatio = async (): Promise<number> => {
  const response = await axiosInstance.get<ApiResponse<number>>(
    `${PREFIX}/internal-student-ratio`
  );
  return response.data.result || 0;
};

export const updateEducationalUnit = async (
  data: EducationalUnitRequest
): Promise<EducationalUnitResponse> => {
  const response = await axiosInstance.put<ApiResponse<EducationalUnitResponse>>(
    `${PREFIX}/my-educationalUnit`,
    data
  );
  return response.data.result;
};

export const getDepartmentStats = async (): Promise<DepartmentStatResponse[]> => {
  const response = await axiosInstance.get<ApiResponse<DepartmentStatResponse[]>>(
    `${PREFIX}/department-stats`
  );
  return response.data.result || [];
};

export const getRecentActivities = async (): Promise<RecentActivityResponse[]> => {
  const response = await axiosInstance.get<ApiResponse<RecentActivityResponse[]>>(
    `${PREFIX}/recent-activities`
  );
  return response.data.result || [];
};