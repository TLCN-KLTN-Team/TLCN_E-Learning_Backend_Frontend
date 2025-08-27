import type { ChatMessageResponse } from "@/types/chat.types";
import type { ApiResponse } from "../../types/response/apiResponse";
import axiosInstance from "./httpClient/axiosInstance";

export const getMessagesByChannelId = async (
  channelId: string
): Promise<ChatMessageResponse[]> => {
  const response = await axiosInstance.get<ApiResponse<ChatMessageResponse[]>>(
    `/server/messages/${channelId}`
  );
  return response.data.result;
};
