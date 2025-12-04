import type { ChatMessageResponse } from "@/types/chat.types";
import axiosInstance from "../httpClient/axiosInstance";
import type { ApiResponse } from "../response/apiResponse";

export const getMessagesByChannelId = async (
  channelId: string
): Promise<ChatMessageResponse[]> => {
  const response = await axiosInstance.get<ApiResponse<ChatMessageResponse[]>>(
    `/server/messages/${channelId}`
  );
  return response.data.result;
};
