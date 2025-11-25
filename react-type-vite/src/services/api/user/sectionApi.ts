import axiosInstance from "../httpClient/axiosInstance";
import type { ApiResponse } from "../response/apiResponse";
import type { SectionResponse } from "../response/sectionResponse";

const SECTION_API_BASE = "/course-management/user/published-courses";

export const getSectionsByCourseId = async (courseId: number) => {
  const response = await axiosInstance.get<ApiResponse<SectionResponse[]>>(
    `${SECTION_API_BASE}/section/${courseId}`
  );
  return response.data.result;
};
