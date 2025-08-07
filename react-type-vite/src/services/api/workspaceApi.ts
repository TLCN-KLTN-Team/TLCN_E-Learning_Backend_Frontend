import axiosInstance from "../shared/axiosInstance";
import type { ApiResponse, PaginatedResponse } from "../shared/apiResponse";

export interface Participant {
  userId: string;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
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
  participants: Participant[];
  messages?: ChatMessageResponse[] | null;
}

export interface WorkspaceResponse {
  id: string;
  name: string;
  description: string;
  avatarUrl: string;
  channels: ChannelResponse[];
  members: Participant[];
}

export interface ChatMessageRequest {
  channelId: string;
  message: string;
}

export const getWorkspaces = async (
  pageNumber: number,
  pageSize: number
): Promise<PaginatedResponse<WorkspaceResponse>> => {
  const response = await axiosInstance.get<
    ApiResponse<PaginatedResponse<WorkspaceResponse>>
  >(`/server/workspaces?page=${pageNumber}&size=${pageSize}`);
  return response.data.result;
};

export const getWorkspaceById = async (
  getWorkspaceById: string
): Promise<WorkspaceResponse> => {
  const respoonse = await axiosInstance.get<ApiResponse<WorkspaceResponse>>(
    `/server/workspaces/${getWorkspaceById}`
  );
  return respoonse.data.result;
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
