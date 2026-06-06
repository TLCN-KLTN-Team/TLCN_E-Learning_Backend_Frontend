package demo.app.chat_app.service.impl;

import demo.app.chat_app.model.workspace.AssignmentSession;
import demo.app.chat_app.model.workspace.Channel;
import demo.app.chat_app.model.workspace.ChannelStatus;
import demo.app.chat_app.repository.AssignmentSessionRepository;
import demo.app.chat_app.repository.ChannelRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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
    AssignmentSessionRepository assignmentSessionRepository;

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
        backfillSubmittedChannelIds(channels, now);
    }

    /**
     * Nhóm không tự nộp trước deadline vẫn phải được tính là đã "nộp" để
     * buildWithPeerScores() không bỏ qua khi thu thập điểm.
     * Gom theo assignmentSessionId để tối thiểu số lần ghi MongoDB.
     */
    private void backfillSubmittedChannelIds(List<Channel> channels, Instant now) {
        Map<String, List<String>> sessionToChannels = channels.stream()
                .filter(c -> c.getAssignmentSessionId() != null)
                .collect(Collectors.groupingBy(
                        Channel::getAssignmentSessionId,
                        Collectors.mapping(Channel::getId, Collectors.toList())));

        if (sessionToChannels.isEmpty()) return;

        List<AssignmentSession> sessions = assignmentSessionRepository.findAllById(sessionToChannels.keySet());
        List<AssignmentSession> toSave = new ArrayList<>();

        for (AssignmentSession session : sessions) {
            List<String> channelIds = sessionToChannels.get(session.getId());
            boolean changed = false;
            for (String channelId : channelIds) {
                if (!session.getSubmittedChannelIds().contains(channelId)) {
                    session.getSubmittedChannelIds().add(channelId);
                    changed = true;
                    log.info("UC-41: auto-submit channel {} into session {} (deadline passed)", channelId, session.getId());
                }
            }
            if (changed) {
                session.setUpdatedAt(now);
                toSave.add(session);
            }
        }

        if (!toSave.isEmpty()) assignmentSessionRepository.saveAll(toSave);
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
