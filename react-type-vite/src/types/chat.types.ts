import type { MessageType } from "./chat.enums";

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

export interface WorkspaceResponse {
  id: string;
  name: string;
  description: string;
  avatarUrl: string;
}

export interface BasicChannelResponse {
  id: string;
  channelName: string;
  participantHash?: string | null;
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
