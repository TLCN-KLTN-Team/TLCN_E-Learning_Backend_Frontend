import type { MessageType } from "./chat.enums";

// Channel Type Enum matching backend
export const ChannelType = {
  TEXT: "TEXT",
  GROUP: "GROUP",
  ANNOUNCEMENT: "ANNOUNCEMENT",
  VOICE_LIVE: "VOICE_LIVE",
  POST: "POST",
} as const;

export type ChannelType = (typeof ChannelType)[keyof typeof ChannelType];

export interface UserResponse {
  id: string;
  firstName: string;
  lastName: string;
  mssv: string;
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
  mssv: string;
  avatar?: string | null;
  owner: boolean;
}

export interface Participant {
  id: string;
  mssv: string;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  owner?: boolean;
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
  channels: SectionChannel[];
}

export interface BasicChannelResponse {
  id: string;
  channelName: string;
  participantHash?: string | null;
  description?: string;
  endTime?: number;
  ended?: boolean;
}

export interface GroupResponse {
  id: string;
  groupName: string;
  channelId: string;
  description?: string;
  participants?: Participant[];
  createdDate?: string;
}

export interface ChannelResponse {
  id: string;
  participantHash?: string | null;
  channelName: string;
  description?: string;
  participants?: Participant[];
  messages?: ChatMessageResponse[] | null;
  isPrivate: boolean;
  endTime: number;
  ended?: boolean;
  channelType?: ChannelType;
  groups?: GroupResponse[];
}

export interface CreateChannelRequest {
  workspaceId: string;
  sectionId?: string;
  channelName: string;
  description?: string;
  memberIds?: string[];
  isPrivate: boolean;
  channelType?: ChannelType;
  durationInMinutes?: number; // Duration in minutes
}

export interface CreateGroupRequest {
  channelId: string;
  name: string;
  description?: string;
  memberIds?: string[];
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
  sender: Participant;
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
