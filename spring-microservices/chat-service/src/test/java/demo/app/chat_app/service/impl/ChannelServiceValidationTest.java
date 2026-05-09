package demo.app.chat_app.service.impl;

import demo.app.chat_app.dto.request.BulkRandomChannelRequest;
import demo.app.chat_app.exception.AppException;
import demo.app.chat_app.exception.ErrorCode;
import demo.app.chat_app.mapper.ChannelMapper;
import demo.app.chat_app.repository.ChannelRepository;
import demo.app.chat_app.repository.SectionRepository;
import demo.app.chat_app.repository.WorkspaceRepository;
import demo.app.chat_app.service.ChannelMemberService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * UC-41: validate deadline trong bulkRandomlyCreateChannels.
 *
 * Validation chạy đầu tiên — không cần mock Section/Workspace/Channel.
 */
@ExtendWith(MockitoExtension.class)
class ChannelServiceValidationTest {

    @Mock private WorkspaceRepository workspaceRepository;
    @Mock private SectionRepository sectionRepository;
    @Mock private ChannelRepository channelRepository;
    @Mock private ChannelMemberService channelMemberService;
    @Mock private ChannelMapper channelMapper;
    @Mock private ChatMessageServiceImpl chatMessageService;

    @InjectMocks
    private ChannelServiceImpl service;

    private BulkRandomChannelRequest request(String submission, String crossReview, boolean allow) {
        return BulkRandomChannelRequest.builder()
                .sectionId("sec-1")
                .channelName("Bài tập")
                .description("desc")
                .channelType("GROUP")
                .submissionDeadline(submission)
                .crossReviewDeadline(crossReview)
                .allowCrossReview(allow)
                .membersPerGroup(3)
                .build();
    }

    @Test
    void rejects_whenSubmissionDeadlineIsBlank() {
        BulkRandomChannelRequest req = request(null, null, false);
        assertThatThrownBy(() -> service.bulkRandomlyCreateChannels(req))
                .isInstanceOf(AppException.class)
                .extracting(e -> ((AppException) e).getErrorCode())
                .isEqualTo(ErrorCode.SUBMISSION_DEADLINE_REQUIRED);
    }

    @Test
    void rejects_whenSubmissionDeadlineInPast() {
        Instant past = Instant.now().minusSeconds(3600);
        BulkRandomChannelRequest req = request(past.toString(), null, false);
        assertThatThrownBy(() -> service.bulkRandomlyCreateChannels(req))
                .isInstanceOf(AppException.class)
                .extracting(e -> ((AppException) e).getErrorCode())
                .isEqualTo(ErrorCode.END_TIME_INVALID);
    }

    @Test
    void rejects_whenAllowCrossReviewButNoCrossReviewDeadline() {
        Instant submission = Instant.now().plusSeconds(3600);
        BulkRandomChannelRequest req = request(submission.toString(), null, true);
        assertThatThrownBy(() -> service.bulkRandomlyCreateChannels(req))
                .isInstanceOf(AppException.class)
                .extracting(e -> ((AppException) e).getErrorCode())
                .isEqualTo(ErrorCode.INVALID_DEADLINE_RANGE);
    }

    @Test
    void rejects_whenCrossReviewDeadlineLessThanSubmissionPlus1Hour() {
        Instant submission = Instant.now().plusSeconds(3600);
        Instant crossReview = submission.plusSeconds(60); // chỉ 1 phút sau, KHÔNG đủ 1 giờ
        BulkRandomChannelRequest req = request(submission.toString(), crossReview.toString(), true);
        assertThatThrownBy(() -> service.bulkRandomlyCreateChannels(req))
                .isInstanceOf(AppException.class)
                .extracting(e -> ((AppException) e).getErrorCode())
                .isEqualTo(ErrorCode.INVALID_DEADLINE_RANGE);
    }

    @Test
    void rejects_whenCrossReviewDeadlineSlightlyLessThanSubmissionPlus1Hour() {
        // Boundary: < submission + 1h vẫn bị reject; == submission + 1h thì spec
        // "ít nhất 1 giờ" coi là hợp lệ (validation dùng isBefore — strict less).
        Instant submission = Instant.now().plusSeconds(3600);
        Instant crossReview = submission.plusSeconds(3599); // 1 second short of 1h
        BulkRandomChannelRequest req = request(submission.toString(), crossReview.toString(), true);
        assertThatThrownBy(() -> service.bulkRandomlyCreateChannels(req))
                .isInstanceOf(AppException.class)
                .extracting(e -> ((AppException) e).getErrorCode())
                .isEqualTo(ErrorCode.INVALID_DEADLINE_RANGE);
    }
}
