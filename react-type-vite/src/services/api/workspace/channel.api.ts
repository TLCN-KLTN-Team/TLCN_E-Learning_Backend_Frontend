import axiosInstance from "../httpClient/axiosInstance";
import type { ApiResponse } from "../response/apiResponse";
import type {
  BasicChannelResponse,
  BulkRandomChannelRequest,
  BulkRandomChannelResponse,
  ChannelResponse,
  ChatMessageRequest,
  ChatMessageResponse,
  CreateChannelRequest,
  UserResponse,
} from "@/types/chat.types";

const CHANNEL_API_BASE_URL = "/server/channels";

export const getBasicChannelsByWorkspaceId = async (
  workspaceId: string
): Promise<ChannelResponse[]> => {
  const response = await axiosInstance.get<ApiResponse<ChannelResponse[]>>(
    `${CHANNEL_API_BASE_URL}/basic/${workspaceId}`
  );
  return response.data.result;
};

export const getChannel = async (
  channelId: string
): Promise<ChannelResponse> => {
  const response = await axiosInstance.get<ApiResponse<ChannelResponse>>(
    `${CHANNEL_API_BASE_URL}/${channelId}`
  );
  return response.data.result;
};

export const createChannel = async (
  request: CreateChannelRequest
): Promise<ChannelResponse> => {
  const response = await axiosInstance.post<ApiResponse<ChannelResponse>>(
    `${CHANNEL_API_BASE_URL}/create`,
    request
  );
  return response.data.result;
};

export const bulkRandomCreateChannels = async (
  request: BulkRandomChannelRequest
): Promise<BulkRandomChannelResponse> => {
  const response = await axiosInstance.post<ApiResponse<BulkRandomChannelResponse>>(
    `${CHANNEL_API_BASE_URL}/bulk-random`,
    request
  );
  return response.data.result;
}

export const sendMessage = async (
  request: ChatMessageRequest
): Promise<ChatMessageResponse> => {
  const response = await axiosInstance.post<ApiResponse<ChatMessageResponse>>(
    `/server/messages/send`,
    request
  );
  return response.data.result;
};

export const softDeleteChannel = async (channelId: string): Promise<void> => {
  await axiosInstance.delete(`/server/channels/${channelId}/soft-delete`);
};

export const getMembersInChannel = async (
  channelId: string
): Promise<UserResponse[]> => {
  const response = await axiosInstance.get<ApiResponse<UserResponse[]>>(
    `${CHANNEL_API_BASE_URL}/members/${channelId}`
  );
  return response.data.result;
};

export const getPublicChannelBySectionId = async (
  sectionId: string
): Promise<ChannelResponse> => {

  const response = await axiosInstance.get<ApiResponse<ChannelResponse>>(
    `${CHANNEL_API_BASE_URL}/section/${sectionId}`
  );
  return response.data.result;
};

export const getListBasicChannelsBySectionId = async (
  sectionId: string
): Promise<BasicChannelResponse[]> => {
  const response = await axiosInstance.get<ApiResponse<BasicChannelResponse[]>>(
    `${CHANNEL_API_BASE_URL}/list/section/${sectionId}`
  );
  return response.data.result;
}