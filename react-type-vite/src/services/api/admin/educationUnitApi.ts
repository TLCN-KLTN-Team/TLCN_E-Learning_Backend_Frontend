import axiosInstance from "../httpClient/axiosInstance";
import type { ApiResponse } from "../response/apiResponse";
import type { EducationalUnitResponse } from "../response/educationalUnitResponse";

export const getMyInstitution = async (): Promise<EducationalUnitResponse> => {
  const response = await axiosInstance.get<ApiResponse<EducationalUnitResponse>>(
    `/course-management/educational-unit/my-institution`
  );
  return response.data.result;
};