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
  assignmentSessionId?: string | null;
  submissionDeadline?: string; // ISO instant
  crossReviewDeadline?: string; // ISO instant, null khi không bật chấm chéo
  allowCrossReview?: boolean;
  submissionClosedAt?: string | null;
  expiresAt?: string;
  phase?: ChannelPhase;
}

export interface BulkRandomChannelResponse {
  channels: BasicChannelResponse[];
}

export interface UpdateChannelRequest {
  name?: string;
  description?: string;
  status?: ChannelStatus;
  isReadOnly?: boolean;
  isPublic?: boolean;
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
  /** Có thể null nếu sender không còn trong workspace hoặc user-service không trả info. */
  sender?: UserResponse | null;
  messageType: MessageType;
  status?: MessageStatus;
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

// UC-41: payload submit form chấm chéo
export interface CrossReviewSubmitRequest {
  /** ID channel nhóm bị chấm — bắt buộc vì một channel chấm nhiều nhóm */
  reviewedChannelId: string;
  score: number; // 0 - 10
  comment?: string;
}

/** UC-41: bài nộp của một nhóm trong session — trả về từ /cross-review-attachments */
export interface SessionGroupSubmissionsResponse {
  channelId: string;
  channelName: string;
  files: AttachmentResponse[];
}

export interface CrossReviewScoreResponse {
  id: string;
  reviewerChannelId: string;
  reviewedChannelId: string;
  reviewerUserId: string;
  score: number;
  comment?: string | null;
  submittedAt: string;
  updatedAt: string;
}

/** UC-41 Batch: một entry trong batch submit */
export interface CrossReviewBatchEntry {
  reviewedChannelId: string;
  score: number;
  comment?: string;
}

/** UC-41 Batch: payload khi nhóm nhấn "Nộp bài chấm" */
export interface CrossReviewBatchSubmitRequest {
  entries: CrossReviewBatchEntry[];
}

/** UC-41 Batch: response sau khi nộp batch thành công */
export interface CrossReviewScoreOfGroupResponse {
  id: string;
  reviewerChannelId: string;
  assignmentSessionId: string;
  submittedByUserId: string;
  entries: CrossReviewBatchEntry[];
  submittedAt: string;
  updatedAt: string;
}

/** UC-41: kết quả tính điểm cuối cùng theo thuật toán Median */
export interface FinalScoreResponse {
  channelId: string;
  selfScore?: number | null;
  medianScore?: number | null;
  finalScore?: number | null;
  usedSelfScore: boolean;
  reviewerCount: number;
}

// UC-41: trạng thái thu điểm của phiên làm bài
export const ScoreCollectionStatus = {
  PENDING: "PENDING",
  COLLECTING: "COLLECTING",
  COLLECTED: "COLLECTED",
  FAILED: "FAILED",
  SENT_TO_LMS: "SENT_TO_LMS",
} as const;

export type ScoreCollectionStatus =
  (typeof ScoreCollectionStatus)[keyof typeof ScoreCollectionStatus];

export interface AssignmentSessionResponse {
  id: string;
  sectionId: string;
  /** ID lớp học bên course-service (Section.classId) — dùng để liệt kê Assignment khi gửi điểm sang LMS. */
  classId?: number | null;
  name: string;
  description?: string | null;
  submissionDeadline: string;       // ISO instant
  crossReviewDeadline?: string | null;
  allowCrossReview: boolean;
  channels: BasicChannelResponse[];
  submittedChannelIds: string[];
  totalChannels: number;
  submittedCount: number;
  scoreCollectionStatus?: ScoreCollectionStatus | null;
  scoreCollectionError?: string | null;
  scoreCollectedAt?: string | null;
  createdAt: string;
}

export interface PeerScoreEntryResponse {
  reviewerChannelId: string;
  score: number | null;
  comment?: string | null;
  submittedAt: string;
}

export interface GroupFinalScoreResponse {
  id: string;
  assignmentSessionId: string;
  channelId: string;
  sectionId: string;
  peerScores: PeerScoreEntryResponse[];
  selfScore?: number | null;
  /** Bản ghi tự chấm đầy đủ (score + comment + thời điểm), null nếu nhóm không tự chấm. */
  selfReview?: PeerScoreEntryResponse | null;
  medianPeerScore?: number | null;
  finalScore?: number | null;
  usedSelfScore: boolean;
  reviewerCount: number;
  memberUserIds?: string[];
  /** "CALCULATED" | "NO_SUBMISSION" | "NO_PEERS" | "SENT_TO_LMS" */
  status?: string | null;
  calculatedAt?: string | null;
  sentToLmsAt?: string | null;
  manuallyOverridden?: boolean;
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
