import axiosInstance from "../httpClient/axiosInstance";
import type { ApiResponse } from "../response/apiResponse";
import type {
  GroupResponse,
  CreateGroupRequest,
  UserProfileResponse,
} from "@/types/chat.types";

const GROUP_API_BASE_URL = "/server/groups";

/**
 * Get all groups by channel ID
 * @param channelId - The channel ID
 * @returns List of groups
 */
export const getAllGroupsByChannelId = async (
  channelId: string
): Promise<GroupResponse[]> => {
  const response = await axiosInstance.get<ApiResponse<GroupResponse[]>>(
    `${GROUP_API_BASE_URL}/${channelId}`
  );
  return response.data.result;
};

/**
 * Get members in a channel by keyword (MSSV)
 * @param channelId - The channel ID
 * @param keyword - Search keyword (MSSV)
 * @returns List of user profiles
 */
export const getMembersInChannelByMssv = async (
  channelId: string,
  keyword: string
): Promise<UserProfileResponse[]> => {
  const response = await axiosInstance.get<ApiResponse<UserProfileResponse[]>>(
    `${GROUP_API_BASE_URL}/members/${channelId}`,
    {
      params: { keyword },
    }
  );
  return response.data.result;
};

/**
 * Create a new group
 * @param request - Create group request data
 * @returns Created group response
 */
export const createGroup = async (
  request: CreateGroupRequest
): Promise<GroupResponse> => {
  const response = await axiosInstance.post<ApiResponse<GroupResponse>>(
    GROUP_API_BASE_URL,
    request
  );
  return response.data.result;
};
