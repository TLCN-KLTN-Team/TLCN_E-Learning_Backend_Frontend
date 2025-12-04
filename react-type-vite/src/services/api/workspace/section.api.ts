import axiosInstance from "../httpClient/axiosInstance";
import type { ApiResponse } from "../response/apiResponse";
import type { SectionResponse } from "@/types/chat.types";

const SECTION_API_BASE_URL = "/server/sections";

/**
 * Get all sections by workspace ID
 * @param workspaceId - The workspace ID
 * @returns List of sections with their channels
 */
export const getSectionsByWorkspaceId = async (
  workspaceId: string
): Promise<SectionResponse[]> => {
  const response = await axiosInstance.get<ApiResponse<SectionResponse[]>>(
    `${SECTION_API_BASE_URL}/${workspaceId}`
  );
  return response.data.result;
};
