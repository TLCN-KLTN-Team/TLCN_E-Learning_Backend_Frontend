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
 *   REVIEW — đã qua hạn nộp, đang chấm chéo (chỉ khi allowCrossReview)
 *            chat & upload SUBMISSION mới bị khoá; reviewer của nhóm
 *            khác vẫn xem được attachment SUBMISSION qua endpoint
 *            cross-review.
 *   LOCKED — đã qua mốc cuối, mọi hành động đều khoá trừ giảng viên.
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
        return this == OPEN;
    }

    public boolean isCrossReviewAccessible() {
        return this == REVIEW;
    }

    /**
     * UC-41 guard: chỉ cho phép thành viên ghi (chat, upload, submit) trong phase OPEN.
     * Channel không phải bài tập nhóm (submissionDeadline = null) cũng coi là OPEN.
     * Throw AppException(CHANNEL_LOCKED) khi không thoả.
     */
    public static void assertOpenForMember(Channel channel) {
        if (of(channel, Instant.now()) != OPEN) {
            throw new AppException(ErrorCode.CHANNEL_LOCKED);
        }
    }
}
