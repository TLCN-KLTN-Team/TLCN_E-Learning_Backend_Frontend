package demo.app.chat_app.service.util;

import demo.app.chat_app.exception.AppException;
import demo.app.chat_app.exception.ErrorCode;
import demo.app.chat_app.model.workspace.Channel;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * UC-41: kiểm tra bảng truth của 3 phase + guard assertOpenForMember.
 */
class ChannelPhaseTest {

    private static final Instant T0 = Instant.parse("2026-05-09T10:00:00Z");
    private static final Instant SUBMISSION = T0.plusSeconds(3600); // T0 + 1h
    private static final Instant CROSS_REVIEW = T0.plusSeconds(3 * 3600); // T0 + 3h

    private Channel channel(boolean allowCrossReview, Instant submission, Instant crossReview) {
        Channel c = new Channel();
        c.setSubmissionDeadline(submission);
        c.setCrossReviewDeadline(crossReview);
        c.setAllowCrossReview(allowCrossReview);
        return c;
    }

    @Test
    void phase_isOpen_whenNowBeforeSubmission() {
        Channel c = channel(true, SUBMISSION, CROSS_REVIEW);
        assertThat(ChannelPhase.of(c, T0)).isEqualTo(ChannelPhase.OPEN);
    }

    @Test
    void phase_isReview_whenAllowCrossReviewAndBetweenDeadlines() {
        Channel c = channel(true, SUBMISSION, CROSS_REVIEW);
        Instant midReview = SUBMISSION.plusSeconds(60);
        assertThat(ChannelPhase.of(c, midReview)).isEqualTo(ChannelPhase.REVIEW);
    }

    @Test
    void phase_isLocked_afterCrossReviewDeadline() {
        Channel c = channel(true, SUBMISSION, CROSS_REVIEW);
        assertThat(ChannelPhase.of(c, CROSS_REVIEW.plusSeconds(1))).isEqualTo(ChannelPhase.LOCKED);
    }

    @Test
    void phase_isLocked_whenNoCrossReviewAndPastSubmission() {
        Channel c = channel(false, SUBMISSION, null);
        assertThat(ChannelPhase.of(c, SUBMISSION.plusSeconds(1))).isEqualTo(ChannelPhase.LOCKED);
    }

    @Test
    void phase_isOpen_forLegacyChannelWithoutSubmissionDeadline() {
        Channel c = new Channel(); // tất cả null
        assertThat(ChannelPhase.of(c, T0)).isEqualTo(ChannelPhase.OPEN);
    }

    @Test
    void phase_skipsReview_whenAllowCrossReviewButCrossDeadlineNull() {
        // edge: nếu cross-review bật nhưng không có deadline → coi như không có review
        Channel c = channel(true, SUBMISSION, null);
        assertThat(ChannelPhase.of(c, SUBMISSION.plusSeconds(1))).isEqualTo(ChannelPhase.LOCKED);
    }

    @Test
    void phase_atExactSubmissionInstant_isReview() {
        // tại đúng mốc submissionDeadline, isBefore(submission) = false → đã chuyển phase
        Channel c = channel(true, SUBMISSION, CROSS_REVIEW);
        assertThat(ChannelPhase.of(c, SUBMISSION)).isEqualTo(ChannelPhase.REVIEW);
    }

    @Test
    void assertOpenForMember_passes_whenOpen() {
        Channel c = channel(true, Instant.now().plusSeconds(3600), Instant.now().plusSeconds(7200));
        // không throw
        ChannelPhase.assertOpenForMember(c);
    }

    @Test
    void assertOpenForMember_throwsChannelLocked_whenLocked() {
        Channel c = channel(false, Instant.now().minusSeconds(60), null);
        assertThatThrownBy(() -> ChannelPhase.assertOpenForMember(c))
                .isInstanceOf(AppException.class)
                .extracting(e -> ((AppException) e).getErrorCode())
                .isEqualTo(ErrorCode.CHANNEL_LOCKED);
    }

    @Test
    void assertOpenForMember_passes_whenInReview() {
        // Nghiệp vụ mới: REVIEW cho phép chat và upload GENERAL — không throw.
        Instant past = Instant.now().minusSeconds(60);
        Instant future = Instant.now().plusSeconds(3600);
        Channel c = channel(true, past, future);
        // không throw
        ChannelPhase.assertOpenForMember(c);
    }
}
