import type { MessageType } from "./chat.enums";

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
} as const;

export type ChannelStatus = (typeof ChannelStatus)[keyof typeof ChannelStatus];

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
  endTime?: number; // Unix timestamp in milliseconds, optional
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
  endTime: string; // ISO-8601 string for backend Instant parsing
  membersPerGroup: number; // Số lượng thành viên trong một nhóm
  allowCrossReview: boolean; // Cho phép chấm bài chéo
}

export interface ChatMessageRequest {
  channelId: string;
  content: string;
}
export interface ChatMessageResponse {
  id: string;
  channelId?: string | null;
  me: boolean;
  content: string;
  sender: UserResponse;
  messageType: MessageType;
  fileUrl?: string | null;
  createdDate: string;
}
export interface AttachmentResponse {
  success: boolean;
  message: string;
  messageId?: string; // Optional, if the upload was part of a message
  fileUrl: string;
}
