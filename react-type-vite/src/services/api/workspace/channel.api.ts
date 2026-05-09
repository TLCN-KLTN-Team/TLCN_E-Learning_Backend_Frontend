import axiosInstance from "../httpClient/axiosInstance";
import type { ApiResponse } from "../response/apiResponse";
import type {
  AttachmentCategory,
  AttachmentResponse,
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

// ─── UC-41: cross-review & file panel ────────────────────────────────

/**
 * Liệt kê attachment của channel theo phân loại.
 * Default GENERAL nếu không truyền category.
 */
export const getChannelAttachments = async (
  channelId: string,
  category?: AttachmentCategory
): Promise<AttachmentResponse[]> => {
  const response = await axiosInstance.get<ApiResponse<AttachmentResponse[]>>(
    `${CHANNEL_API_BASE_URL}/${channelId}/attachments`,
    { params: category ? { category } : undefined }
  );
  return response.data.result;
};

/**
 * Lấy channel mà nhóm này được phân công chấm chéo.
 * Throw nếu allowCrossReview=false hoặc chưa được pair.
 */
export const getCrossReviewTarget = async (
  channelId: string
): Promise<BasicChannelResponse> => {
  const response = await axiosInstance.get<ApiResponse<BasicChannelResponse>>(
    `${CHANNEL_API_BASE_URL}/${channelId}/cross-review-target`
  );
  return response.data.result;
};

/**
 * Lấy SUBMISSION attachments của channel mà nhóm này được phân chấm.
 * Chỉ truy cập được trong phase REVIEW.
 */
export const getCrossReviewAttachments = async (
  channelId: string
): Promise<AttachmentResponse[]> => {
  const response = await axiosInstance.get<ApiResponse<AttachmentResponse[]>>(
    `${CHANNEL_API_BASE_URL}/${channelId}/cross-review-attachments`
  );
  return response.data.result;
};

/**
 * UC-41: upload file vào channel với phân loại category.
 * Wrap upload-file-only — tạo file-only message kèm category để BE lưu vào
 * collection attachments với category đúng.
 */
export const uploadChannelFile = async (
  channelId: string,
  category: AttachmentCategory,
  files: FileList | File[],
): Promise<void> => {
  const formData = new FormData();
  formData.append("channelId", channelId);
  formData.append(
    "clientMessageId",
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `up-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  formData.append("category", category);
  Array.from(files).forEach((f) => formData.append("files", f));

  await axiosInstance.post(`/server/files/upload-file-only`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};