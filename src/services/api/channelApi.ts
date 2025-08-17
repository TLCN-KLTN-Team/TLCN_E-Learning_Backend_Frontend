import axiosInstance from "../shared/axiosInstance";
import type { ApiResponse } from "../shared/apiResponse";
import type { Participant } from "./workspaceApi";

export interface BasicChannelResponse {
  id: string;
  channelName: string;
  participantHash?: string | null;
}

export interface ChatMessageResponse {
  id: string;
  channelId?: string | null;
  me: boolean;
  message: string;
  sender: Participant;
  createdDate: string;
}

export interface ChannelResponse {
  id: string;
  participantHash?: string | null;
  channelName: string;
  participants?: Participant[];
  messages?: ChatMessageResponse[] | null;
}

export interface CreateChannelRequest {
  workspaceId: string;
  name: string;
  description?: string;
  memberIds?: string[];
}

export interface ChatMessageRequest {
  channelId: string;
  message: string;
}

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

const sendMessageWithFiles = async (
  formData: FormData
): Promise<ChatMessageResponse> => {
  const response = await axiosInstance.post<ApiResponse<ChatMessageResponse>>(
    `/server/messages/sendWithFiles`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data.result;
};
