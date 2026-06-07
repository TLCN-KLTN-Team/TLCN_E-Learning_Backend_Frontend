package com.hoangphihiep.service;

import com.hoangphihiep.entity.GroupAssignment;
import com.hoangphihiep.events.AssignmentSessionCreatedEvent;
import com.hoangphihiep.events.ScoreCalculatedEvent;
import com.hoangphihiep.exception.AppException;
import com.hoangphihiep.exception.ErrorCode;
import com.hoangphihiep.repository.GroupAssignmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

/**
 * Đồng bộ điểm bài tập nhóm chấm chéo (UC-41) từ chat-service sang course-service.
 *
 * <p>Bài tập nhóm sống ở chat-service (AssignmentSession). course-service giữ một
 * {@link GroupAssignment} cho mỗi nhóm (channel) làm bản ghi điểm trong gradebook, được điều khiển
 * bằng 2 Kafka event:</p>
 * <ul>
 *   <li>{@code ASSIGNMENT_SESSION_CREATED} → {@link #createGroupAssignments} tạo record cho từng
 *   nhóm ở {@code status = SUBMISSION}, chưa có điểm.</li>
 *   <li>{@code SCORE_CALCULATED} → {@link #applyCrossReviewScores} cập nhật điểm cuối, đánh giá
 *   (chỉ nội dung nhận xét) và status kết thúc cho từng nhóm.</li>
 * </ul>
 *
 * <p>Cả hai đều <b>upsert</b> theo (sessionId, channelId) nên an toàn khi event tới sai thứ tự hoặc
 * giáo viên gửi lại điểm. Idempotency ở cấp event do consumer đảm nhiệm (ProcessedEvent).</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CrossReviewScoreGradingService {

    private static final String STATUS_CALCULATED = "CALCULATED";
    private static final String STATUS_SENT_TO_LMS = "SENT_TO_LMS";
    private static final String STATUS_NO_SUBMISSION = "NO_SUBMISSION";
    private static final String STATUS_NO_PEERS = "NO_PEERS";
    private static final int DEFAULT_MAX_SCORE = 10;

    private final GroupAssignmentRepository groupAssignmentRepository;

    /** Tạo bản ghi nhóm khi phiên được mở (chưa có điểm). */
    @Transactional
    public void createGroupAssignments(AssignmentSessionCreatedEvent event) {
        if (event.getSessionId() == null || event.getSessionId().isBlank()) {
            log.error("ASSIGNMENT_SESSION_CREATED thiếu sessionId — bỏ qua");
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        List<AssignmentSessionCreatedEvent.GroupEntry> groups = event.getGroups();
        if (groups == null || groups.isEmpty()) {
            log.warn("ASSIGNMENT_SESSION_CREATED session {} không có nhóm nào", event.getSessionId());
            return;
        }

        int maxScore = event.getMaxScore() != null ? event.getMaxScore() : DEFAULT_MAX_SCORE;
        Date now = new Date();
        int created = 0;

        for (AssignmentSessionCreatedEvent.GroupEntry group : groups) {
            if (group.getChannelId() == null || group.getChannelId().isBlank()) {
                log.warn("ASSIGNMENT_SESSION_CREATED session {} có nhóm thiếu channelId — bỏ qua", event.getSessionId());
                continue;
            }
            // Upsert theo (session, channel) — không ghi đè điểm nếu record đã tồn tại.
            GroupAssignment ga = groupAssignmentRepository
                    .findBySessionIdAndChannelId(event.getSessionId(), group.getChannelId())
                    .orElseGet(() -> GroupAssignment.builder()
                            .sessionId(event.getSessionId())
                            .channelId(group.getChannelId())
                            .status(GroupAssignment.STATUS_SUBMISSION)
                            .createdAt(now)
                            .build());

            ga.setClassId(event.getClassId());
            ga.setCourseId(event.getCourseId());
            ga.setTitle(event.getName());
            ga.setDescription(event.getDescription());
            ga.setSubmissionDeadline(toDate(event.getSubmissionDeadline()));
            ga.setCrossReviewDeadline(toDate(event.getCrossReviewDeadline()));
            ga.setMaxScore(maxScore);
            ga.setMemberUserIds(group.getMemberUserIds());
            ga.setUpdatedAt(now);
            // status chỉ set lần tạo; không reset về SUBMISSION nếu đã COMPLETED (gửi lại metadata).
            if (ga.getStatus() == null) {
                ga.setStatus(GroupAssignment.STATUS_SUBMISSION);
            }

            groupAssignmentRepository.save(ga);
            created++;
        }

        log.info("Tạo/đồng bộ {} bản ghi bài tập nhóm cho phiên {} (class {})",
                created, event.getSessionId(), event.getClassId());
    }

    /** Ghi điểm cuối + đánh giá khi giáo viên gửi điểm sang LMS. */
    @Transactional
    public void applyCrossReviewScores(ScoreCalculatedEvent event) {
        if (event.getSessionId() == null || event.getSessionId().isBlank()) {
            log.error("SCORE_CALCULATED event thiếu sessionId — bỏ qua");
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        List<ScoreCalculatedEvent.ScoreEntry> scores = event.getScores();
        if (scores == null || scores.isEmpty()) {
            log.warn("SCORE_CALCULATED session {} không có entry điểm nào", event.getSessionId());
            return;
        }

        int maxScore = event.getMaxScore() != null ? event.getMaxScore() : DEFAULT_MAX_SCORE;
        Date now = new Date();
        int graded = 0;

        for (ScoreCalculatedEvent.ScoreEntry entry : scores) {
            if (entry.getChannelId() == null || entry.getChannelId().isBlank()) {
                log.warn("SCORE_CALCULATED session {} có entry thiếu channelId — bỏ qua", event.getSessionId());
                continue;
            }
            // Upsert: nếu SESSION_CREATED chưa tới (sai thứ tự) vẫn dựng được record từ metadata event.
            GroupAssignment ga = groupAssignmentRepository
                    .findBySessionIdAndChannelId(event.getSessionId(), entry.getChannelId())
                    .orElseGet(() -> GroupAssignment.builder()
                            .sessionId(event.getSessionId())
                            .channelId(entry.getChannelId())
                            .createdAt(now)
                            .build());

            ga.setClassId(event.getClassId());
            ga.setCourseId(event.getCourseId());
            ga.setTitle(event.getName());
            ga.setDescription(event.getDescription());
            ga.setSubmissionDeadline(toDate(event.getSubmissionDeadline()));
            ga.setCrossReviewDeadline(toDate(event.getCrossReviewDeadline()));
            ga.setMaxScore(maxScore);
            if (entry.getMemberUserIds() != null) {
                ga.setMemberUserIds(entry.getMemberUserIds());
            }
            ga.setEvaluations(entry.getComments() != null ? new ArrayList<>(entry.getComments()) : new ArrayList<>());
            ga.setFinalScore(capScore(entry.getFinalScore(), maxScore, event.getSessionId()));
            ga.setStatus(mapStatus(entry.getStatus()));
            ga.setUpdatedAt(now);

            groupAssignmentRepository.save(ga);
            if (ga.getFinalScore() != null) {
                graded++;
            }
        }

        log.info("Ghi điểm bài tập nhóm phiên {} (class {}): {}/{} nhóm có điểm",
                event.getSessionId(), event.getClassId(), graded, scores.size());
    }

    /** Map status từ chat-service → status hiển thị course-service. */
    private String mapStatus(String chatStatus) {
        if (STATUS_CALCULATED.equals(chatStatus) || STATUS_SENT_TO_LMS.equals(chatStatus)) {
            return GroupAssignment.STATUS_COMPLETED;
        }
        if (STATUS_NO_SUBMISSION.equals(chatStatus)) {
            return GroupAssignment.STATUS_NO_SUBMISSION;
        }
        if (STATUS_NO_PEERS.equals(chatStatus)) {
            return GroupAssignment.STATUS_NO_PEERS;
        }
        // Mặc định coi như đã hoàn tất nếu có điểm; không thì giữ COLLECTING.
        return GroupAssignment.STATUS_COMPLETED;
    }

    private Double capScore(Double score, int maxScore, String sessionId) {
        if (score == null) {
            return null;
        }
        if (score > maxScore) {
            log.warn("finalScore {} > maxScore {} của bài tập nhóm phiên {} — cap về maxScore",
                    score, maxScore, sessionId);
            return (double) maxScore;
        }
        return score;
    }

    private Date toDate(Instant instant) {
        return instant != null ? Date.from(instant) : null;
    }
}
