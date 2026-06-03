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
  CrossReviewScoreResponse,
  CrossReviewSubmitRequest,
  SessionGroupSubmissionsResponse,
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
 * UC-41: lấy bài nộp của TẤT CẢ nhóm khác trong session, gom theo nhóm.
 * Chỉ truy cập được trong phase REVIEW.
 */
export const getCrossReviewAttachments = async (
  channelId: string
): Promise<SessionGroupSubmissionsResponse[]> => {
  const response = await axiosInstance.get<ApiResponse<SessionGroupSubmissionsResponse[]>>(
    `${CHANNEL_API_BASE_URL}/${channelId}/cross-review-attachments`
  );
  return response.data.result ?? [];
};

/**
 * Lấy danh sách ảnh (attachmentType=IMAGE) đã gửi trong channel.
 * Phục vụ gallery "Ảnh đã gửi" trong panel thông tin kênh.
 */
export const getChannelImages = async (
  channelId: string,
): Promise<AttachmentResponse[]> => {
  const response = await axiosInstance.get<ApiResponse<AttachmentResponse[]>>(
    `${CHANNEL_API_BASE_URL}/${channelId}/images`,
  );
  return response.data.result;
};

/**
 * Lấy danh sách file (mọi attachmentType trừ IMAGE) đã gửi trong channel.
 * Phục vụ mục "File đã gửi" trong panel thông tin kênh.
 */
export const getChannelFiles = async (
  channelId: string,
): Promise<AttachmentResponse[]> => {
  const response = await axiosInstance.get<ApiResponse<AttachmentResponse[]>>(
    `${CHANNEL_API_BASE_URL}/${channelId}/files`,
  );
  return response.data.result;
};

/**
 * UC-41: upload file vào channel với phân loại category.
 * Wrap upload-file-only — tạo file-only message kèm category để BE lưu vào
 * collection attachments với category đúng.
 */
/**
 * UC-41: nhóm chấm chéo submit điểm + nhận xét cho nhóm được phân công.
 * Backend upsert theo cặp (reviewerChannelId, reviewedChannelId) và
 * tự bắn notification tới mọi thành viên nhóm bị chấm.
 */
export const submitCrossReview = async (
  channelId: string,
  payload: CrossReviewSubmitRequest,
): Promise<CrossReviewScoreResponse> => {
  const response = await axiosInstance.post<ApiResponse<CrossReviewScoreResponse>>(
    `${CHANNEL_API_BASE_URL}/${channelId}/cross-review/submit`,
    payload,
  );
  return response.data.result;
};

/**
 * UC-41: tất cả điểm nhóm này đã nộp trong session — FE prefill theo từng nhóm.
 * Trả về [] nếu chưa submit lần nào.
 */
export const getMyCrossReviews = async (
  channelId: string,
): Promise<CrossReviewScoreResponse[]> => {
  const response = await axiosInstance.get<ApiResponse<CrossReviewScoreResponse[]>>(
    `${CHANNEL_API_BASE_URL}/${channelId}/cross-review/my-score`,
  );
  return response.data.result ?? [];
};

/**
 * UC-41: lấy các file SUBMISSION được track trong AssignmentSession của channel.
 * Load từ session.submittedFileMessageIds, lọc theo channelId.
 * Trả về [] nếu channel không thuộc session nào.
 */
export const getSessionSubmissions = async (
  channelId: string,
): Promise<AttachmentResponse[]> => {
  const response = await axiosInstance.get<ApiResponse<AttachmentResponse[]>>(
    `${CHANNEL_API_BASE_URL}/${channelId}/session-submissions`,
  );
  return response.data.result ?? [];
};

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
    headers: { "Content-Type": undefined },
  });
};