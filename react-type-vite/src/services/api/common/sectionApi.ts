import axiosInstance from "../httpClient/axiosInstance";
import type { ApiResponse } from "../response/apiResponse";
import type { SectionResponse } from "../response/sectionResponse";

const SECTION_API_BASE = "/course-management/sections";

export const getSectionsByCourseId = async (courseId: number) => {
  const response = await axiosInstance.get<ApiResponse<SectionResponse[]>>(
    `${SECTION_API_BASE}/course/${courseId}`
  );
  return response.data.result;
};
