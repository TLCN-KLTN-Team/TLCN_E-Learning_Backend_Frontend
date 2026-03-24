import type { UserResponse } from "@/types/chat.types";
import type { ApiResponse } from "../response/apiResponse";
import axiosInstance from "../httpClient/axiosInstance";

const CHANNEL_MEMBER_URL = "/server/channel-members";

const getActiveChannelMembers = async (
  channelId: string,
): Promise<UserResponse[]> => {
  const response = await axiosInstance.get<ApiResponse<UserResponse[]>>(
    `${CHANNEL_MEMBER_URL}/${channelId}`,
  );
  return response.data.result;
};

export const channelMemberApi = {
  getActiveChannelMembers,
};
