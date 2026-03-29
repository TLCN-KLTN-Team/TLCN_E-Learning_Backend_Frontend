import axiosInstance from "../httpClient/axiosInstance";
import type { ApiResponse } from "../response/apiResponse";
import type { SectionResponse } from "@/types/chat.types";

const SECTION_API_BASE_URL = "/server/sections";

export const getSectionById = async (
  sectionId: string,
): Promise<SectionResponse> => {
  const response = await axiosInstance.get<ApiResponse<SectionResponse>>(
    `${SECTION_API_BASE_URL}/${sectionId}`,
  );
  return response.data.result;
};

/**
 * Get all sections by workspace ID
 * @param workspaceId - The workspace ID
 * @returns List of sections with their channels
 */
export const getSectionsByWorkspaceId = async (
  workspaceId: string,
): Promise<SectionResponse[]> => {
  const response = await axiosInstance.get<ApiResponse<SectionResponse[]>>(
    `${SECTION_API_BASE_URL}/workspace/${workspaceId}`,
  );
  return response.data.result;
};

export const getStudentCountBySectionId = async (
  sectionId: string,
): Promise<number> => {
  const response = await axiosInstance.get<ApiResponse<number>>(
    `${SECTION_API_BASE_URL}/${sectionId}/student-count`,
  );
  return response.data.result;
};
