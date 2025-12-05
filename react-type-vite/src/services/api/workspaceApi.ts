import axiosInstance from "./httpClient/axiosInstance";
import type { ApiResponse, PaginatedResponse } from "./response/apiResponse";
import type {
  UserResponse,
  WorkspaceResponse,
  UserChatInfo,
} from "@/types/chat.types";

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

export const getStudentsByMSSV = async (
  mssv: string
): Promise<UserResponse[]> => {
  const response = await axiosInstance.get<ApiResponse<UserResponse[]>>(
    `/identity/users/students?mssv=${mssv}`
  );
  return response.data.result;
};

export const getUsersByKeyword = async (
  keyword: string
): Promise<UserChatInfo[]> => {
  const response = await axiosInstance.get<ApiResponse<UserChatInfo[]>>(
    `/identity/users/student/ids?keyword=${encodeURIComponent(keyword)}`
  );
  return response.data.result;
};
