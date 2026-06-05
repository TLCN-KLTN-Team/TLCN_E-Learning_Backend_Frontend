package demo.app.chat_app.scheduler;

import demo.app.chat_app.model.workspace.AssignmentSession;
import demo.app.chat_app.model.workspace.ScoreCollectionStatus;
import demo.app.chat_app.repository.AssignmentSessionRepository;
import demo.app.chat_app.service.ScoreCollectionService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;

/**
 * Tự động thu thập điểm sau khi crossReviewDeadline qua.
 *
 * Chạy mỗi 5 phút; tìm các session:
 *   - allowCrossReview = true
 *   - crossReviewDeadline < now
 *   - scoreCollectionStatus IN (PENDING, FAILED)
 *
 * Nếu thu thập thất bại, session được đánh dấu FAILED — giáo viên sẽ thấy
 * nút retry trên UI và có thể gọi endpoint POST /sessions/{id}/collect-scores.
 */
@Slf4j
@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ScoreCollectionScheduler {

    AssignmentSessionRepository sessionRepository;
    ScoreCollectionService scoreCollectionService;

    /**
     * Khi service restart, session nào đang ở COLLECTING (crash giữa chừng)
     * sẽ không bao giờ được scheduler pick up lại vì scheduler chỉ query PENDING/FAILED.
     * Reset tất cả về FAILED để scheduler retry trong chu kỳ tiếp theo.
     */
    @EventListener(ApplicationReadyEvent.class)
    public void resetStuckCollectingSessions() {
        Instant now = Instant.now();

        // 1. Session bị kẹt ở COLLECTING do service crash giữa chừng → reset về FAILED
        List<AssignmentSession> stuck = sessionRepository
                .findByCrossReviewDeadlineBeforeAndAllowCrossReviewTrueAndScoreCollectionStatusIn(
                        now, List.of(ScoreCollectionStatus.COLLECTING));

        if (!stuck.isEmpty()) {
            log.warn("Found {} session(s) stuck in COLLECTING on startup — resetting to FAILED for retry",
                    stuck.size());
            for (AssignmentSession session : stuck) {
                session.setScoreCollectionStatus(ScoreCollectionStatus.FAILED);
                session.setScoreCollectionError("Reset from COLLECTING on service restart");
                sessionRepository.save(session);
                log.warn("Reset session {} COLLECTING → FAILED", session.getId());
            }
        }

        // 2. Session cũ tạo trước khi field scoreCollectionStatus tồn tại (= null trong MongoDB)
        //    → scheduler query $in[PENDING,FAILED] bỏ qua null, phải normalize về PENDING
        List<AssignmentSession> legacy = sessionRepository
                .findByCrossReviewDeadlineBeforeAndAllowCrossReviewTrueAndScoreCollectionStatusIsNull(now);

        if (!legacy.isEmpty()) {
            log.warn("Found {} legacy session(s) with null scoreCollectionStatus — normalizing to PENDING",
                    legacy.size());
            for (AssignmentSession session : legacy) {
                session.setScoreCollectionStatus(ScoreCollectionStatus.PENDING);
                sessionRepository.save(session);
                log.warn("Normalized session {} null → PENDING", session.getId());
            }
        }
    }

    @Scheduled(fixedDelay = 300_000) // mỗi 5 phút
    public void collectDueSessions() {
        Instant now = Instant.now();

        List<AssignmentSession> dueSessions = sessionRepository
                .findByCrossReviewDeadlineBeforeAndAllowCrossReviewTrueAndScoreCollectionStatusIn(
                        now,
                        List.of(ScoreCollectionStatus.PENDING, ScoreCollectionStatus.FAILED));

        if (dueSessions.isEmpty()) return;

        log.info("ScoreCollectionScheduler: found {} session(s) due for collection", dueSessions.size());

        for (AssignmentSession session : dueSessions) {
            String sessionId = session.getId();
            try {
                log.info("Auto-collecting scores for session {}", sessionId);
                scoreCollectionService.collectAndCalculate(sessionId);
            } catch (Exception e) {
                // collectAndCalculate đã tự set status = FAILED; log ở đây để monitor.
                log.error("Auto-collection failed for session {}: {}", sessionId, e.getMessage());
            }
        }
    }
}
