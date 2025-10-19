import axiosInstance from "../httpClient/axiosInstance";
import type { ApiResponse, PaginatedResponse } from "../response/apiResponse";
import type { EducationalUnitResponse } from "../response/educationalUnitResponse";

const PREFIX = "/course-management/educational-unit";

export const getMyEducationalUnit = async (): Promise<EducationalUnitResponse> => {
  const response = await axiosInstance.get<
    ApiResponse<EducationalUnitResponse>
  >(`/course-management/educational-unit/my-educationalUnit`);
  return response.data.result;
};

export const getAllEducationalUnits = async (): Promise<
  PaginatedResponse<EducationalUnitResponse>
> => {
  const response = await axiosInstance.get<
    ApiResponse<PaginatedResponse<EducationalUnitResponse>>
  >(`${PREFIX}/get-all`);

  return response.data.result;
};
