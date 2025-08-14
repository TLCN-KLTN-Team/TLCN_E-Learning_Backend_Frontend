import axiosInstance from "../shared/axiosInstance";
import type { ApiResponse, PaginatedResponse } from "../shared/apiResponse";

export interface UserResponse {
  id: string;
  firstName: string;
  lastName: string;
  mssv: string;
  avatarUrl?: string | null;
}

export interface Participant {
  userId: string;
  mssv: string;
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
  participants?: Participant[];
  messages?: ChatMessageResponse[] | null;
}

export interface CreateChannelRequest {
  workspaceId: string;
  name: string;
  description?: string;
  members?: Participant[];
}

export interface WorkspaceResponse {
  id: string;
  name: string;
  description: string;
  avatarUrl: string;
  channels: ChannelResponse[];
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

export const getChannel = async (
  channelId: string
): Promise<ChannelResponse> => {
  const response = await axiosInstance.get<ApiResponse<ChannelResponse>>(
    `/server/channels/${channelId}`
  );
  return response.data.result;
};

export const getStudentsByMSSV = async (
  mssv: string
): Promise<UserResponse[]> => {
  const response = await axiosInstance.get<ApiResponse<UserResponse[]>>(
    `/identity/users/students?mssv=${mssv}`
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
