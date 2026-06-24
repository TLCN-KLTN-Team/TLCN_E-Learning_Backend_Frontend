package demo.app.chat_app.service.util;

import demo.app.chat_app.exception.AppException;
import demo.app.chat_app.exception.ErrorCode;
import demo.app.chat_app.model.workspace.Channel;

import java.time.Instant;

/**
 * UC-41: pha của channel GROUP làm bài tập, dẫn xuất runtime từ
 * (submissionDeadline, crossReviewDeadline, allowCrossReview, now).
 *
 *   OPEN   — còn nộp bài, mọi hành động ghi đều cho phép
 *   REVIEW — đã qua hạn nộp, đang trong phiên chấm điểm (allowCrossReview).
 *            Chat và upload GENERAL vẫn được phép; chỉ SUBMISSION bị khoá
 *            (frontend chặn qua SubmitAssignmentModal).
 *   LOCKED — đã qua mốc cuối, mọi hành động ghi đều khoá.
 *
 * Channel.status cũ: ACTIVE → khi chuyển REVIEW set LOCKED
 *                            → khi chuyển LOCKED (post-cross-review) set ARCHIVED
 *                            → giảng viên hard-delete sau chấm: DELETED
 */
public enum ChannelPhase {
    OPEN,
    REVIEW,
    LOCKED;

    public static ChannelPhase of(Channel channel, Instant now) {
        Instant submissionDeadline = channel.getSubmissionDeadline();
        if (submissionDeadline == null) {
            // Channel cũ không phải bài tập nhóm — coi như luôn OPEN
            return OPEN;
        }
        if (now.isBefore(submissionDeadline)) {
            return OPEN;
        }
        if (channel.isAllowCrossReview()
                && channel.getCrossReviewDeadline() != null
                && now.isBefore(channel.getCrossReviewDeadline())) {
            return REVIEW;
        }
        return LOCKED;
    }

    public boolean isWriteAllowedForMember() {
        return this != LOCKED;
    }

    public boolean isCrossReviewAccessible() {
        return this == REVIEW;
    }

    /**
     * UC-41 guard: cho phép thành viên ghi (chat, upload GENERAL) trong OPEN và REVIEW.
     * Chỉ block khi LOCKED (phiên chấm điểm đã kết thúc hoàn toàn).
     * Channel không phải bài tập nhóm (submissionDeadline = null) coi là OPEN — luôn pass.
     */
    public static void assertOpenForMember(Channel channel) {
        if (of(channel, Instant.now()) == LOCKED) {
            throw new AppException(ErrorCode.CHANNEL_LOCKED);
        }
    }
}
