export const MessageType = {
  JOIN: "JOIN",
  CHAT: "CHAT",
  LEAVE: "LEAVE",
} as const;

export type MessageType = (typeof MessageType)[keyof typeof MessageType];
