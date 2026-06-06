package demo.app.chat_app.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import demo.app.chat_app.dto.event.ScoreCalculatedEvent;
import demo.app.chat_app.exception.AppException;
import demo.app.chat_app.exception.ErrorCode;
import demo.app.chat_app.model.workspace.AssignmentSession;
import demo.app.chat_app.model.workspace.ChannelMember;
import demo.app.chat_app.model.workspace.GroupFinalScore;
import demo.app.chat_app.model.workspace.MemberStatus;
import demo.app.chat_app.model.workspace.PeerReview;
import demo.app.chat_app.model.workspace.ScoreCollectionStatus;
import demo.app.chat_app.repository.AssignmentSessionRepository;
import demo.app.chat_app.repository.ChannelMemberRepository;
import demo.app.chat_app.repository.ChatMessageRepository;
import demo.app.chat_app.repository.GroupFinalScoreRepository;
import demo.app.chat_app.repository.PeerReviewRepository;
import demo.app.chat_app.service.ScoreCollectionService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ScoreCollectionServiceImpl implements ScoreCollectionService {

    AssignmentSessionRepository sessionRepository;
    PeerReviewRepository peerReviewRepository;
    ChannelMemberRepository channelMemberRepository;
    ChatMessageRepository chatMessageRepository;
    GroupFinalScoreRepository finalScoreRepository;
    KafkaTemplate<String, String> scoreKafkaTemplate;
    ObjectMapper objectMapper;

    @NonFinal
    @Value("${kafka.topic.score-events}")
    String scoreEventsTopic;

    // ─────────────────────────────────────────────────────────────────────

    @Override
    public List<GroupFinalScore> collectAndCalculate(String sessionId) {
        AssignmentSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new AppException(ErrorCode.ASSIGNMENT_SESSION_NOT_FOUND));

        // Idempotent: trả kết quả cũ nếu đã collect hoặc đã gửi LMS.
        if (session.getScoreCollectionStatus() == ScoreCollectionStatus.COLLECTED
                || session.getScoreCollectionStatus() == ScoreCollectionStatus.SENT_TO_LMS) {
            log.info("Session {} already collected (status={}), returning cached results",
                    sessionId, session.getScoreCollectionStatus());
            return finalScoreRepository.findAllByAssignmentSessionId(sessionId);
        }

        session.setScoreCollectionStatus(ScoreCollectionStatus.COLLECTING);
        sessionRepository.save(session);

        try {
            List<GroupFinalScore> results = computeAllGroupScores(session);

            session.setScoreCollectionStatus(ScoreCollectionStatus.COLLECTED);
            session.setScoreCollectedAt(Instant.now());
            session.setScoreCollectionError(null);
            sessionRepository.save(session);

            // KHÔNG publish Kafka ở đây — giáo viên sẽ gọi sendScoresToLms() sau khi xem xét.
            log.info("Score collection completed for session {}: {} groups processed", sessionId, results.size());
            return results;

        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Score collection failed for session {}: {}", sessionId, e.getMessage(), e);
            session.setScoreCollectionStatus(ScoreCollectionStatus.FAILED);
            session.setScoreCollectionError(e.getMessage());
            sessionRepository.save(session);
            throw new AppException(ErrorCode.SCORE_COLLECTION_FAILED);
        }
    }

    @Override
    public List<GroupFinalScore> getSessionScores(String sessionId) {
        sessionRepository.findById(sessionId)
                .orElseThrow(() -> new AppException(ErrorCode.ASSIGNMENT_SESSION_NOT_FOUND));

        List<GroupFinalScore> scores = finalScoreRepository.findAllByAssignmentSessionId(sessionId);

        // TEACHER xem tất cả điểm; sinh viên chỉ xem điểm của nhóm mình thuộc về.
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isTeacher = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_TEACHER"));
        if (isTeacher) {
            return scores;
        }

        String userId = auth != null ? auth.getName() : null;
        return scores.stream()
                .filter(s -> s.getMemberUserIds() != null && s.getMemberUserIds().contains(userId))
                .map(this::redactForStudent)
                .toList();
    }

    /**
     * Sinh viên chỉ được xem điểm cuối của nhóm mình — ẩn toàn bộ breakdown
     * (điểm từng nhóm peer, comment, điểm tự chấm, trung vị) để không lộ ai đã chấm bao nhiêu.
     * Lưu ý: bản ghi chỉ được đọc (không persist), nên xoá field in-memory là an toàn.
     */
    private GroupFinalScore redactForStudent(GroupFinalScore s) {
        s.setPeerScores(Collections.emptyList());
        s.setSelfScore(null);
        s.setMedianPeerScore(null);
        return s;
    }

    @Override
    public List<GroupFinalScore> sendScoresToLms(String sessionId) {
        AssignmentSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new AppException(ErrorCode.ASSIGNMENT_SESSION_NOT_FOUND));

        ScoreCollectionStatus status = session.getScoreCollectionStatus();
        if (status != ScoreCollectionStatus.COLLECTED && status != ScoreCollectionStatus.SENT_TO_LMS) {
            throw new AppException(ErrorCode.SCORE_NOT_COLLECTED_YET);
        }

        List<GroupFinalScore> scores = finalScoreRepository.findAllByAssignmentSessionId(sessionId);

        publishScoreCalculatedEvent(session, scores);

        Instant now = Instant.now();
        for (GroupFinalScore score : scores) {
            score.setSentToLmsAt(now);
            if (score.getStatus() == GroupFinalScore.CollectStatus.CALCULATED) {
                score.setStatus(GroupFinalScore.CollectStatus.SENT_TO_LMS);
            }
            finalScoreRepository.save(score);
        }

        session.setScoreCollectionStatus(ScoreCollectionStatus.SENT_TO_LMS);
        sessionRepository.save(session);

        log.info("Session {} scores sent to LMS at {} ({} groups)", sessionId, now, scores.size());
        return finalScoreRepository.findAllByAssignmentSessionId(sessionId);
    }

    @Override
    public GroupFinalScore updateGroupFinalScore(String sessionId, String channelId, Double newFinalScore) {
        if (newFinalScore == null || newFinalScore < 0.0 || newFinalScore > 10.0) {
            throw new AppException(ErrorCode.CROSS_REVIEW_SCORE_INVALID);
        }

        GroupFinalScore score = finalScoreRepository
                .findByAssignmentSessionIdAndChannelId(sessionId, channelId)
                .orElseThrow(() -> new AppException(ErrorCode.GROUP_SCORE_NOT_FOUND));

        score.setFinalScore(newFinalScore);
        score.setManuallyOverridden(true);
        GroupFinalScore saved = finalScoreRepository.save(score);

        log.info("Session {} channel {} finalScore overridden to {} by teacher", sessionId, channelId, newFinalScore);
        return saved;
    }

    @Override
    public void resetScoreCollection(String sessionId) {
        AssignmentSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new AppException(ErrorCode.ASSIGNMENT_SESSION_NOT_FOUND));

        session.setScoreCollectionStatus(null);
        session.setScoreCollectedAt(null);
        session.setScoreCollectionError(null);
        sessionRepository.save(session);

        List<GroupFinalScore> existing = finalScoreRepository.findAllByAssignmentSessionId(sessionId);
        if (!existing.isEmpty()) {
            finalScoreRepository.deleteAll(existing);
        }

        log.warn("[DEV] Reset scoreCollectionStatus to null for session {} ({} GroupFinalScore records deleted)",
                sessionId, existing.size());
    }

    // ─────────────────────────────────────────────────────────────────────
    // Core computation — two-phase per channel
    // ─────────────────────────────────────────────────────────────────────

    private List<GroupFinalScore> computeAllGroupScores(AssignmentSession session) {
        // Load tất cả peer_reviews một lần, tránh N+1 query.
        List<PeerReview> allReviews = peerReviewRepository.findAllByAssignmentSessionId(session.getId());

        // Group by reviewedChannelId trong memory.
        Map<String, List<PeerReview>> byReviewed = allReviews.stream()
                .collect(Collectors.groupingBy(PeerReview::getReviewedChannelId));

        // Re-derive tập channel "đã nộp" từ ground truth để tự chữa data cũ/lệch:
        // hợp của submittedChannelIds đã lưu + channel có file SUBMISSION thực tế.
        Set<String> submittedChannelIds = resolveSubmittedChannelIds(session);

        // Phase 1: thu thập peerScores bằng channelId + assignmentSessionId, lưu xuống DB.
        List<GroupFinalScore> phase1 = new ArrayList<>();
        for (String channelId : session.getChannelIds()) {
            GroupFinalScore record = buildWithPeerScores(session, channelId, byReviewed, submittedChannelIds);
            finalScoreRepository
                    .findByAssignmentSessionIdAndChannelId(session.getId(), channelId)
                    .ifPresent(existing -> record.setId(existing.getId()));
            phase1.add(finalScoreRepository.save(record));
            log.debug("Phase 1 saved peerScores for channel {}: {} peer entries",
                    channelId, record.getPeerScores() == null ? 0 : record.getPeerScores().size());
        }

        // Phase 2: tính median + finalScore, cập nhật lại DB.
        List<GroupFinalScore> results = new ArrayList<>();
        for (GroupFinalScore saved : phase1) {
            results.add(applyMedianCalculation(saved));
        }

        return results;
    }

    /**
     * Re-derive tập channelId "đã nộp" từ ground truth, không chỉ tin
     * session.submittedChannelIds (có thể cũ/lệch). Hợp của:
     *   - submittedChannelIds đã lưu (submitPractices / scheduler backfill / upload file)
     *   - channelId của các message SUBMISSION trong submittedFileMessageIds
     */
    private Set<String> resolveSubmittedChannelIds(AssignmentSession session) {
        Set<String> submitted = new HashSet<>();
        if (session.getSubmittedChannelIds() != null) {
            submitted.addAll(session.getSubmittedChannelIds());
        }

        List<String> fileMessageIds = session.getSubmittedFileMessageIds();
        if (fileMessageIds != null && !fileMessageIds.isEmpty()) {
            chatMessageRepository.findAllById(fileMessageIds).forEach(message -> {
                if (message.getChannelId() != null) {
                    submitted.add(message.getChannelId());
                }
            });
        }
        return submitted;
    }

    /**
     * Phase 1: xây dựng GroupFinalScore với peerScores từ PeerReview
     * (query bằng channelId + assignmentSessionId). Chưa tính median/finalScore.
     *
     * peerScores LUÔN được thu thập nếu có review — độc lập với việc nhóm có tự
     * nộp bài hay không (điểm nhóm NHẬN được do nhóm khác chấm). Trạng thái nộp
     * chỉ là nhãn: dùng để phân biệt NO_PEERS (đã nộp, chưa ai chấm) với
     * NO_SUBMISSION (chưa nộp & chưa ai chấm).
     */
    private GroupFinalScore buildWithPeerScores(
            AssignmentSession session,
            String channelId,
            Map<String, List<PeerReview>> byReviewed,
            Set<String> submittedChannelIds) {

        Instant now = Instant.now();
        List<String> memberUserIds = getMemberUserIds(channelId);

        // Lấy các review mà reviewedChannelId == channelId (điểm nhận được bởi nhóm này).
        List<PeerReview> reviews = byReviewed.getOrDefault(channelId, List.of());

        Double selfScore = null;
        List<GroupFinalScore.PeerScoreEntry> peerEntries = new ArrayList<>();

        for (PeerReview review : reviews) {
            if (channelId.equals(review.getReviewerChannelId())) {
                selfScore = review.getScore();
            } else {
                peerEntries.add(GroupFinalScore.PeerScoreEntry.builder()
                        .reviewerChannelId(review.getReviewerChannelId())
                        .score(review.getScore())
                        .comment(review.getComment())
                        .submittedAt(review.getSubmittedAt())
                        .build());
            }
        }

        GroupFinalScore.CollectStatus status;
        if (!peerEntries.isEmpty()) {
            status = GroupFinalScore.CollectStatus.CALCULATED;
        } else if (submittedChannelIds.contains(channelId)) {
            status = GroupFinalScore.CollectStatus.NO_PEERS;
        } else {
            status = GroupFinalScore.CollectStatus.NO_SUBMISSION;
        }

        return GroupFinalScore.builder()
                .assignmentSessionId(session.getId())
                .channelId(channelId)
                .sectionId(session.getSectionId())
                .workspaceId(session.getWorkspaceId())
                .memberUserIds(memberUserIds)
                .peerScores(peerEntries)
                .selfScore(selfScore)
                .status(status)
                .calculatedAt(now)
                .build();
    }

    /**
     * Phase 2: tính median + finalScore từ peerScores đã lưu, cập nhật lại DB.
     */
    private GroupFinalScore applyMedianCalculation(GroupFinalScore record) {
        if (record.getStatus() != GroupFinalScore.CollectStatus.CALCULATED) {
            return record;
        }

        List<Double> peerScoreValues = record.getPeerScores().stream()
                .map(GroupFinalScore.PeerScoreEntry::getScore)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        if (peerScoreValues.isEmpty()) {
            record.setStatus(GroupFinalScore.CollectStatus.NO_PEERS);
            return finalScoreRepository.save(record);
        }

        Double medianScore = calcMedian(peerScoreValues);
        Double selfScore = record.getSelfScore();

        Double finalScore;
        boolean usedSelfScore = false;
        if (selfScore == null) {
            finalScore = medianScore;
        } else if (Math.abs(selfScore - medianScore) <= 0.5) {
            finalScore = selfScore;
            usedSelfScore = true;
        } else {
            finalScore = medianScore;
        }

        record.setMedianPeerScore(medianScore);
        record.setFinalScore(finalScore);
        record.setUsedSelfScore(usedSelfScore);

        return finalScoreRepository.save(record);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────

    private List<String> getMemberUserIds(String channelId) {
        return channelMemberRepository
                .findByChannelIdAndStatus(channelId, MemberStatus.ACTIVE)
                .stream()
                .map(ChannelMember::getUserId)
                .toList();
    }

    private Double calcMedian(List<Double> scores) {
        List<Double> sorted = new ArrayList<>(scores);
        Collections.sort(sorted);
        int n = sorted.size();
        if (n % 2 == 1) return sorted.get(n / 2);
        return (sorted.get(n / 2 - 1) + sorted.get(n / 2)) / 2.0;
    }

    private void publishScoreCalculatedEvent(AssignmentSession session, List<GroupFinalScore> scores) {
        try {
            List<ScoreCalculatedEvent.ScoreEntry> entries = scores.stream()
                    .map(s -> ScoreCalculatedEvent.ScoreEntry.builder()
                            .channelId(s.getChannelId())
                            .memberUserIds(s.getMemberUserIds())
                            .finalScore(s.getFinalScore())
                            .status(s.getStatus() != null ? s.getStatus().name() : null)
                            .build())
                    .toList();

            ScoreCalculatedEvent eventData = ScoreCalculatedEvent.builder()
                    .sessionId(session.getId())
                    .sectionId(session.getSectionId())
                    .workspaceId(session.getWorkspaceId())
                    .scores(entries)
                    .build();

            Map<String, Object> envelope = new HashMap<>();
            envelope.put("eventId", UUID.randomUUID().toString());
            envelope.put("eventType", "SCORE_CALCULATED");
            envelope.put("data", eventData);

            String json = objectMapper.writeValueAsString(envelope);
            scoreKafkaTemplate.send(scoreEventsTopic, session.getId(), json);

            log.info("Published SCORE_CALCULATED event for session {}", session.getId());
        } catch (Exception e) {
            log.error("Failed to publish score event for session {}: {}", session.getId(), e.getMessage());
        }
    }
}
