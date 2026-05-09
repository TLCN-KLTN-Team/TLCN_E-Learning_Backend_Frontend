import { ChannelPhase as ChannelPhaseEnum } from "@/types/chat.types";
import type { ChannelPhase } from "@/types/chat.types";

/**
 * UC-41: derive runtime phase từ deadlines + now.
 * Mirror backend ChannelPhase.of(...) — frontend dùng để disable UI theo phase
 * mà không phụ thuộc vào field `phase` trả về (có thể stale).
 */
export const derivePhase = (
  submissionDeadline?: string | null,
  crossReviewDeadline?: string | null,
  allowCrossReview?: boolean,
  now: Date = new Date(),
): ChannelPhase => {
  if (!submissionDeadline) return ChannelPhaseEnum.OPEN;
  const sub = new Date(submissionDeadline);
  if (now < sub) return ChannelPhaseEnum.OPEN;
  if (allowCrossReview && crossReviewDeadline) {
    const cr = new Date(crossReviewDeadline);
    if (now < cr) return ChannelPhaseEnum.REVIEW;
  }
  return ChannelPhaseEnum.LOCKED;
};

/**
 * UC-41: kênh có phải bài tập nhóm có deadline không.
 */
export const isGroupAssignmentChannel = (
  submissionDeadline?: string | null,
): boolean => Boolean(submissionDeadline);
