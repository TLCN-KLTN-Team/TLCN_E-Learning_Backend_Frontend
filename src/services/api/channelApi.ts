import axiosInstance from "../shared/axiosInstance";
import type { ApiResponse } from "../shared/apiResponse";
import type {
  BasicChannelResponse,
  ChannelResponse,
  ChatMessageRequest,
  ChatMessageResponse,
  CreateChannelRequest,
} from "@/types/chat.types";

export const getBasicChannelsByWorkspaceId = async (
  workspaceId: string
): Promise<BasicChannelResponse[]> => {
  const response = await axiosInstance.get<ApiResponse<BasicChannelResponse[]>>(
    `/server/channels/basic/${workspaceId}`
  );
  return response.data.result;
};

export const getChannel = async (
  channelId: string
): Promise<ChannelResponse> => {
  const response = await axiosInstance.get<ApiResponse<ChannelResponse>>(
    `/server/channels/${channelId}`
  );
  return response.data.result;
};

export const createChannel = async (
  request: CreateChannelRequest
): Promise<ChannelResponse> => {
  const response = await axiosInstance.post<ApiResponse<ChannelResponse>>(
    `/server/channels/create`,
    request
  );
  return response.data.result;
};

export const sendMessage = async (
  request: ChatMessageRequest
): Promise<ChatMessageResponse> => {
  const response = await axiosInstance.post<ApiResponse<ChatMessageResponse>>(
    `/server/messages/send`,
    request
  );
  return response.data.result;
};
