import axiosInstance from "../httpClient/axiosInstance";
import type { ApiResponse } from "../response/apiResponse";
import type { EducationalUnitResponse } from "../response/educationalUnitResponse";

const PREFIX = "/course-management/educational-unit";

const getMyEducationalUnit = async (): Promise<EducationalUnitResponse> => {
  const response = await axiosInstance.get<
    ApiResponse<EducationalUnitResponse>
  >(`${PREFIX}/my-educationalUnit`);
  return response.data.result;
};

export default {
  getMyEducationalUnit,
};
