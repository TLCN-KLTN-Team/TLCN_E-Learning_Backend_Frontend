export const ChannelType = {
  TEXT: "TEXT",
  VOICE: "VOICE",
  LIVE_STREAM: "LIVE_STREAM",
  ASSIGNMENT: "ASSIGNMENT",
} as const;

export type ChannelType = (typeof ChannelType)[keyof typeof ChannelType];

export const ChannelStatus = {
  ACTIVE: "ACTIVE",
  LOCKED: "LOCKED",
  ARCHIVED: "ARCHIVED",
} as const;

export type ChannelStatus = (typeof ChannelStatus)[keyof typeof ChannelStatus];

export interface Channel {
  id: string;
  participantHash: string;
  channelName: string;
  description: string;
  workspaceId: string;
  classId: number | null;
  memberIds: string[];
  isPrivate: boolean;
  type: ChannelType;
  status: ChannelStatus;
  durationMinutes: number;
}

export interface ChannelMember {
  id: string;
  fullName: string;
  avatar?: string;
  email?: string;
}
