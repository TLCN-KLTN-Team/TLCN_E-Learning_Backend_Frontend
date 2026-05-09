import type { AttachmentType, MessageStatus, MessageType } from "./chat.enums";

// Channel Type Enum matching backend
export const ChannelType = {
  TEXT: "TEXT",
  GROUP: "GROUP",
  VOICE: "VOICE",
} as const;

export type ChannelType = (typeof ChannelType)[keyof typeof ChannelType];

export const ChannelScope = {
  WORKSPACE: "WORKSPACE",
  SECTION: "SECTION",
  GROUP: "GROUP",
  DIRECT: "DIRECT",
} as const;

export type ChannelScope = (typeof ChannelScope)[keyof typeof ChannelScope];

export const ChannelStatus = {
  ACTIVE: "ACTIVE",
  LOCKED: "LOCKED",
  ARCHIVED: "ARCHIVED",
  DELETED: "DELETED",
} as const;

export type ChannelStatus = (typeof ChannelStatus)[keyof typeof ChannelStatus];

// UC-41: pha runtime của channel GROUP làm bài tập (do BE compute từ deadlines + now)
export const ChannelPhase = {
  OPEN: "OPEN",
  REVIEW: "REVIEW",
  LOCKED: "LOCKED",
} as const;

export type ChannelPhase = (typeof ChannelPhase)[keyof typeof ChannelPhase];

// UC-41: phân loại tài liệu trong channel GROUP
export const AttachmentCategory = {
  GENERAL: "GENERAL",
  SUBMISSION: "SUBMISSION",
} as const;

export type AttachmentCategory =
  (typeof AttachmentCategory)[keyof typeof AttachmentCategory];

export interface UserResponse {
  id: string;
  nickname: string;
  studentId: string;
  avatarUrl?: string | null;
  owner: boolean;
}

export interface UserChatInfo {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
}

export interface UserProfileResponse {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
  avatar?: string | null;
  owner: boolean;
}

export interface WorkspaceResponse {
  id: string;
  name: string;
  description: string;
  avatarUrl: string;
}

export interface SectionChannel {
  id: string;
  channelName: string;
}

export interface SectionResponse {
  id: string;
  name: string;
  isPublic: boolean;
}

export interface BasicChannelResponse {
  id: string;
  name: string;
  isPublic: boolean;
}

export interface ChannelResponse {
  id: string;
  sectionId: string;
  name: string;
  slug: string;
  description: string;
  position: number;
  scope: ChannelScope;
  type: ChannelType;
  status: ChannelStatus;
  isReadOnly: boolean;
  isPublic: boolean;
  memberCount: number;
  lastMessageId: string | null;
  lastActivityAt: string;
  messages: ChatMessageResponse[];
  createdAt: string;
  endTime?: number; // Unix timestamp in milliseconds, optional (legacy)

  // UC-41 (chỉ có với channel GROUP làm bài tập)
  submissionDeadline?: string; // ISO instant
  crossReviewDeadline?: string; // ISO instant, null khi không bật chấm chéo
  allowCrossReview?: boolean;
  reviewTargetChannelId?: string | null;
  submissionClosedAt?: string | null;
  expiresAt?: string;
  phase?: ChannelPhase;
}

export interface BulkRandomChannelResponse {
  channels: BasicChannelResponse[];
}

export interface CreateChannelRequest {
  workspaceId: string;
  sectionId?: string;
  channelName: string;
  description?: string;
  memberIds?: string[];
  channelType?: ChannelType;
  endTime?: string; // ISO-8601 string for backend Instant parsing
  // GROUP channel specific fields
  numberOfGroups?: number; // Số lượng nhóm
  membersPerGroup?: number; // Số lượng thành viên trong một nhóm
  allowCrossReview?: boolean; // Cho phép chấm bài chéo
}

export interface BulkRandomChannelRequest {
  sectionId: string;
  channelType: ChannelType;
  channelName: string;
  description?: string;
  /** UC-41: hạn nộp bài (ISO-8601). Bắt buộc */
  submissionDeadline: string;
  /** UC-41: hạn chấm chéo (ISO-8601). Bắt buộc khi allowCrossReview=true, phải > submissionDeadline + 1h */
  crossReviewDeadline?: string;
  membersPerGroup: number;
  allowCrossReview: boolean;
}

export interface ChatMessageRequest {
  channelId: string;
  content: string;
  clientMessageId?: string;
  textOnly?: boolean;
}
export interface ChatMessageResponse {
  id: string;
  channelId?: string | null;
  clientMessageId?: string | null;
  me: boolean;
  content: string;
  sender: UserResponse;
  messageType: MessageType;
  status?: MessageStatus;
  fileUrl?: string | null;
  attachments?: AttachmentResponse[];
  createdDate: string;
}

export interface AttachmentResponse {
  id: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  attachmentType: AttachmentType;
  /** UC-41: GENERAL (Tài liệu chung) / SUBMISSION (Bài đã nộp) */
  category?: AttachmentCategory;
  fileUrl: string;
  thumbnailUrl?: string | null;
  uploadedAt: string;
}

export interface AttachmentItem {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  category: AttachmentType;
}

/** WebSocket event types broadcast on /topic/channel/{channelId} */
export type ChatEventType = "NEW_MESSAGE" | "MESSAGE_UPDATED";

/**
 * Mirrors backend MessageEvent.
 * - NEW_MESSAGE  → `message` contains the full ChatMessageResponse
 * - MESSAGE_UPDATED → `update` contains partial update payload
 */
export interface MessageUpdatePayload {
  clientMessageId: string;
  attachments?: AttachmentResponse[];
  status?: MessageStatus;
}

export interface ChatEvent {
  type: ChatEventType;
  message?: ChatMessageResponse;       // present when type === "NEW_MESSAGE"
  update?: MessageUpdatePayload;        // present when type === "MESSAGE_UPDATED"
}
