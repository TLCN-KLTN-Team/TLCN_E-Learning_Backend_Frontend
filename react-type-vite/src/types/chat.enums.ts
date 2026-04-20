export const MessageType = {
  TEXT: "TEXT",
  IMAGE: "IMAGE",
  FILE: "FILE",
  MIXED: "MIXED",
  FILE_ONLY: "FILE_ONLY",
} as const;

export const AttachmentType = {
  IMAGE: "IMAGE",
  DOCUMENT: "DOCUMENT",
  VIDEO: "VIDEO",
  AUDIO: "AUDIO",
};

export const MessageStatus = {
  PENDING: "PENDING",
  UPLOADING: "UPLOADING",
  SENT: "SENT",
  DELIVERED: "DELIVERED",
  READ: "READ",
  FAILED: "FAILED",
};

export type MessageType = (typeof MessageType)[keyof typeof MessageType];
export type AttachmentType =
  (typeof AttachmentType)[keyof typeof AttachmentType];
export type MessageStatus = (typeof MessageStatus)[keyof typeof MessageStatus];
