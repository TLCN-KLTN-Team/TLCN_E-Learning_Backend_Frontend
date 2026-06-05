package demo.app.chat_app.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import demo.app.chat_app.dto.event.ScoreCalculatedEvent;
import demo.app.chat_app.exception.AppException;
import demo.app.chat_app.exception.ErrorCode;
import demo.app.chat_app.model.workspace.AssignmentSession;
import demo.app.chat_app.model.workspace.ChannelMember;
import demo.app.chat_app.model.workspace.CrossReviewScoreOfGroup;
import demo.app.chat_app.model.workspace.GroupFinalScore;
import demo.app.chat_app.model.workspace.MemberStatus;
import demo.app.chat_app.model.workspace.ScoreCollectionStatus;
import demo.app.chat_app.repository.AssignmentSessionRepository;
import demo.app.chat_app.repository.ChannelMemberRepository;
import demo.app.chat_app.repository.CrossReviewScoreOfGroupRepository;
import demo.app.chat_app.repository.GroupFinalScoreRepository;
import demo.app.chat_app.service.ScoreCollectionService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ScoreCollectionServiceImpl implements ScoreCollectionService {

    AssignmentSessionRepository sessionRepository;
    CrossReviewScoreOfGroupRepository batchRepository;
    ChannelMemberRepository channelMemberRepository;
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

        // Idempotency: nếu đã thu thập thành công, trả về kết quả cũ.
        if (session.getScoreCollectionStatus() == ScoreCollectionStatus.COLLECTED) {
            log.info("Session {} already collected, returning cached results", sessionId);
            return finalScoreRepository.findAllByAssignmentSessionId(sessionId);
        }

        // Khóa để tránh chạy song song (scheduler + teacher retry cùng lúc).
        session.setScoreCollectionStatus(ScoreCollectionStatus.COLLECTING);
        sessionRepository.save(session);

        try {
            List<GroupFinalScore> results = computeAllGroupScores(session);
            upsertAll(sessionId, results);

            session.setScoreCollectionStatus(ScoreCollectionStatus.COLLECTED);
            session.setScoreCollectedAt(Instant.now());
            session.setScoreCollectionError(null);
            sessionRepository.save(session);

            publishScoreCalculatedEvent(session, results);

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
        return finalScoreRepository.findAllByAssignmentSessionId(sessionId);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Core computation
    // ─────────────────────────────────────────────────────────────────────

    private List<GroupFinalScore> computeAllGroupScores(AssignmentSession session) {
        // Load tất cả batch reviews một lần, tránh N+1 query.
        List<CrossReviewScoreOfGroup> allBatches =
                batchRepository.findAllByAssignmentSessionId(session.getId());

        List<GroupFinalScore> results = new ArrayList<>();
        for (String channelId : session.getChannelIds()) {
            results.add(computeGroupScore(session, channelId, allBatches));
        }
        return results;
    }

    private GroupFinalScore computeGroupScore(
            AssignmentSession session,
            String channelId,
            List<CrossReviewScoreOfGroup> allBatches) {

        Instant now = Instant.now();
        List<String> memberUserIds = getMemberUserIds(channelId);

        // Thiếu bài 1: nhóm chưa nộp submission.
        if (!session.getSubmittedChannelIds().contains(channelId)) {
            return GroupFinalScore.builder()
                    .assignmentSessionId(session.getId())
                    .channelId(channelId)
                    .sectionId(session.getSectionId())
                    .workspaceId(session.getWorkspaceId())
                    .memberUserIds(memberUserIds)
                    .peerScores(List.of())
                    .status(GroupFinalScore.CollectStatus.NO_SUBMISSION)
                    .calculatedAt(now)
                    .build();
        }

        // Thiếu bài 2: thu thập điểm peer (bỏ reviewer chưa nộp batch review tự nhiên).
        Double selfScore = null;
        List<GroupFinalScore.PeerScoreEntry> peerEntries = new ArrayList<>();

        for (CrossReviewScoreOfGroup batch : allBatches) {
            for (CrossReviewScoreOfGroup.ReviewEntry entry : batch.getEntries()) {
                if (!channelId.equals(entry.getReviewedChannelId())) continue;

                if (channelId.equals(batch.getReviewerChannelId())) {
                    // Self-review: nhóm tự chấm mình
                    selfScore = entry.getScore();
                } else {
                    // Peer review: chỉ nhóm đã nộp batch mới xuất hiện ở đây
                    peerEntries.add(GroupFinalScore.PeerScoreEntry.builder()
                            .reviewerChannelId(batch.getReviewerChannelId())
                            .score(entry.getScore())
                            .comment(entry.getComment())
                            .submittedAt(batch.getSubmittedAt())
                            .build());
                }
            }
        }

        if (peerEntries.isEmpty()) {
            return GroupFinalScore.builder()
                    .assignmentSessionId(session.getId())
                    .channelId(channelId)
                    .sectionId(session.getSectionId())
                    .workspaceId(session.getWorkspaceId())
                    .memberUserIds(memberUserIds)
                    .selfScore(selfScore)
                    .peerScores(List.of())
                    .status(GroupFinalScore.CollectStatus.NO_PEERS)
                    .calculatedAt(now)
                    .build();
        }

        // Tính median và áp dụng công thức self-score.
        List<Double> peerScoreValues = peerEntries.stream()
                .map(GroupFinalScore.PeerScoreEntry::getScore)
                .collect(Collectors.toList());
        Double medianScore = calcMedian(peerScoreValues);

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

        return GroupFinalScore.builder()
                .assignmentSessionId(session.getId())
                .channelId(channelId)
                .sectionId(session.getSectionId())
                .workspaceId(session.getWorkspaceId())
                .memberUserIds(memberUserIds)
                .peerScores(peerEntries)
                .selfScore(selfScore)
                .medianPeerScore(medianScore)
                .finalScore(finalScore)
                .usedSelfScore(usedSelfScore)
                .status(GroupFinalScore.CollectStatus.CALCULATED)
                .calculatedAt(now)
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────

    /** Upsert theo compound key (sessionId, channelId) để retry an toàn. */
    private void upsertAll(String sessionId, List<GroupFinalScore> records) {
        for (GroupFinalScore record : records) {
            finalScoreRepository
                    .findByAssignmentSessionIdAndChannelId(sessionId, record.getChannelId())
                    .ifPresent(existing -> record.setId(existing.getId()));
            finalScoreRepository.save(record);
        }
    }

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
            // Kafka failure không rollback điểm đã lưu; scheduler có thể retry event riêng.
            log.error("Failed to publish score event for session {}: {}", session.getId(), e.getMessage());
        }
    }
}
