package demo.app.chat_app.service.impl;

import demo.app.chat_app.model.workspace.Channel;
import demo.app.chat_app.model.workspace.ChannelStatus;
import demo.app.chat_app.repository.ChannelRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

/**
 * UC-41: scheduler chạy mỗi 60s để chuyển trạng thái channel GROUP
 * theo deadline.
 *
 * Transitions:
 *   ACTIVE  → LOCKED   khi qua submissionDeadline VÀ allowCrossReview=true
 *                      (soft-lock = "xóa mềm": chặn chat & upload SUBMISSION
 *                       của thành viên; reviewer của nhóm khác vẫn xem được).
 *   ACTIVE  → ARCHIVED khi qua submissionDeadline VÀ allowCrossReview=false.
 *   LOCKED  → ARCHIVED khi qua crossReviewDeadline.
 *
 * Idempotent qua trường submissionClosedAt: scheduler chỉ xử lý transition
 * lần đầu cho mỗi channel.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ChannelSchedulerService {

    ChannelRepository channelRepository;

    @Scheduled(fixedDelayString = "${app.scheduler.channel-lock-interval-ms:60000}")
    public void runChannelLockTransitions() {
        Instant now = Instant.now();

        closeSubmissionsAndLockOrArchive(now);
        archiveAfterCrossReview(now);
    }

    /**
     * Đóng giai đoạn nộp bài cho channel ACTIVE đã qua submissionDeadline.
     * - allowCrossReview=true  → status LOCKED (vẫn cho reviewer truy cập)
     * - allowCrossReview=false → status ARCHIVED (đóng hẳn)
     */
    private void closeSubmissionsAndLockOrArchive(Instant now) {
        List<Channel> channels = channelRepository.findChannelsToCloseSubmission(ChannelStatus.ACTIVE, now);
        if (channels.isEmpty()) return;

        for (Channel channel : channels) {
            channel.setSubmissionClosedAt(now);
            if (channel.isAllowCrossReview() && channel.getCrossReviewDeadline() != null) {
                channel.setStatus(ChannelStatus.LOCKED);
                log.info("UC-41: channel {} → LOCKED (entering cross-review phase)", channel.getId());
            } else {
                channel.setStatus(ChannelStatus.ARCHIVED);
                channel.setExpiredAt(now);
                log.info("UC-41: channel {} → ARCHIVED (no cross-review)", channel.getId());
            }
            channel.setUpdatedAt(now);
        }
        channelRepository.saveAll(channels);
    }

    /**
     * Channel LOCKED đã qua crossReviewDeadline → ARCHIVED.
     */
    private void archiveAfterCrossReview(Instant now) {
        List<Channel> channels = channelRepository.findChannelsToArchiveAfterCrossReview(ChannelStatus.LOCKED, now);
        if (channels.isEmpty()) return;

        for (Channel channel : channels) {
            channel.setStatus(ChannelStatus.ARCHIVED);
            channel.setExpiredAt(now);
            channel.setUpdatedAt(now);
            log.info("UC-41: channel {} → ARCHIVED (cross-review deadline passed)", channel.getId());
        }
        channelRepository.saveAll(channels);
    }
}
