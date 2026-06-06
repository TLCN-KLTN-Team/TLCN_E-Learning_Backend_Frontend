package demo.app.chat_app.service.impl;

import demo.app.chat_app.dto.request.CrossReviewBatchEntry;
import demo.app.chat_app.dto.request.CrossReviewBatchSubmitRequest;
import demo.app.chat_app.dto.request.CrossReviewSubmitRequest;
import demo.app.chat_app.dto.request.NotificationMessage;
import demo.app.chat_app.dto.response.CrossReviewScoreOfGroupResponse;
import demo.app.chat_app.dto.response.CrossReviewScoreResponse;
import demo.app.chat_app.dto.response.FinalScoreResponse;
import demo.app.chat_app.exception.AppException;
import demo.app.chat_app.exception.ErrorCode;
import demo.app.chat_app.model.workspace.AssignmentSession;
import demo.app.chat_app.model.workspace.Channel;
import demo.app.chat_app.model.workspace.ChannelMember;
import demo.app.chat_app.model.workspace.MemberStatus;
import demo.app.chat_app.model.workspace.PeerReview;
import demo.app.chat_app.repository.AssignmentSessionRepository;
import demo.app.chat_app.repository.ChannelMemberRepository;
import demo.app.chat_app.repository.ChannelRepository;
import demo.app.chat_app.repository.PeerReviewRepository;
import demo.app.chat_app.repository.httpclient.NotificationRepository;
import demo.app.chat_app.service.CrossReviewService;
import demo.app.chat_app.service.util.ChannelPhase;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CrossReviewServiceImpl implements CrossReviewService {

    ChannelRepository channelRepository;
    AssignmentSessionRepository assignmentSessionRepository;
    ChannelMemberRepository channelMemberRepository;
    PeerReviewRepository peerReviewRepository;
    NotificationRepository notificationRepository;

    // ─────────────────────────────────────────────────────────────────────
    // Submit đơn lẻ
    // ─────────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public CrossReviewScoreResponse submitReview(String channelId, CrossReviewSubmitRequest request) {
        String currentUserId = currentUserId();

        Channel reviewerChannel = channelRepository.findById(channelId)
                .orElseThrow(() -> new AppException(ErrorCode.UN_EXISTING_CHANNEL));

        if (!reviewerChannel.isAllowCrossReview()) {
            throw new AppException(ErrorCode.CROSS_REVIEW_NOT_ALLOWED);
        }

        String sessionId = reviewerChannel.getAssignmentSessionId();
        if (sessionId == null) {
            throw new AppException(ErrorCode.ASSIGNMENT_SESSION_NOT_FOUND);
        }

        String reviewedChannelId = request.getReviewedChannelId();

        boolean sameSession = assignmentSessionRepository.findById(sessionId)
                .map(s -> s.getChannelIds() != null && s.getChannelIds().contains(reviewedChannelId))
                .orElse(false);
        if (!sameSession) {
            throw new AppException(ErrorCode.NO_CROSS_REVIEW_TARGET);
        }

        if (ChannelPhase.of(reviewerChannel, Instant.now()) != ChannelPhase.REVIEW) {
            throw new AppException(ErrorCode.CHANNEL_LOCKED);
        }

        channelMemberRepository.findByChannelIdAndUserId(channelId, currentUserId)
                .filter(m -> m.getStatus() == MemberStatus.ACTIVE)
                .orElseThrow(() -> new AppException(ErrorCode.CROSS_REVIEW_NOT_MEMBER));

        if (request.getScore() == null || request.getScore() < 0.0 || request.getScore() > 10.0) {
            throw new AppException(ErrorCode.CROSS_REVIEW_SCORE_INVALID);
        }

        Instant now = Instant.now();
        PeerReview review = peerReviewRepository
                .findByAssignmentSessionIdAndReviewerChannelIdAndReviewedChannelId(
                        sessionId, channelId, reviewedChannelId)
                .orElseGet(() -> PeerReview.builder()
                        .assignmentSessionId(sessionId)
                        .reviewerChannelId(channelId)
                        .reviewedChannelId(reviewedChannelId)
                        .submittedAt(now)
                        .build());

        review.setSubmittedByUserId(currentUserId);
        review.setScore(request.getScore());
        review.setComment(request.getComment());
        review.setUpdatedAt(now);
        if (review.getSubmittedAt() == null) review.setSubmittedAt(now);

        PeerReview saved = peerReviewRepository.save(review);

        List<String> reviewedUserIds = getActiveUserIds(reviewedChannelId);
        notifyReviewedMembers(saved.getId(), channelId, reviewedChannelId,
                reviewerChannel.getName(), saved.getScore(), saved.getComment(),
                reviewedUserIds, currentUserId);

        return toResponse(saved);
    }

    // ─────────────────────────────────────────────────────────────────────
    // UC-41 Batch submit
    // ─────────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public CrossReviewScoreOfGroupResponse submitBatchReview(String channelId, CrossReviewBatchSubmitRequest request) {
        String currentUserId = currentUserId();

        Channel reviewerChannel = channelRepository.findById(channelId)
                .orElseThrow(() -> new AppException(ErrorCode.UN_EXISTING_CHANNEL));

        if (!reviewerChannel.isAllowCrossReview()) {
            throw new AppException(ErrorCode.CROSS_REVIEW_NOT_ALLOWED);
        }
        if (ChannelPhase.of(reviewerChannel, Instant.now()) != ChannelPhase.REVIEW) {
            throw new AppException(ErrorCode.CHANNEL_LOCKED);
        }

        String sessionId = reviewerChannel.getAssignmentSessionId();
        if (sessionId == null) {
            throw new AppException(ErrorCode.ASSIGNMENT_SESSION_NOT_FOUND);
        }

        AssignmentSession session = assignmentSessionRepository.findById(sessionId)
                .orElseThrow(() -> new AppException(ErrorCode.ASSIGNMENT_SESSION_NOT_FOUND));

        channelMemberRepository.findByChannelIdAndUserId(channelId, currentUserId)
                .filter(m -> m.getStatus() == MemberStatus.ACTIVE)
                .orElseThrow(() -> new AppException(ErrorCode.CROSS_REVIEW_NOT_MEMBER));

        for (CrossReviewBatchEntry entry : request.getEntries()) {
            if (!session.getChannelIds().contains(entry.getReviewedChannelId())) {
                throw new AppException(ErrorCode.NO_CROSS_REVIEW_TARGET);
            }
            if (entry.getScore() == null || entry.getScore() < 0.0 || entry.getScore() > 10.0) {
                throw new AppException(ErrorCode.CROSS_REVIEW_SCORE_INVALID);
            }
        }

        Instant now = Instant.now();
        List<PeerReview> savedReviews = new ArrayList<>();

        for (CrossReviewBatchEntry entry : request.getEntries()) {
            PeerReview review = peerReviewRepository
                    .findByAssignmentSessionIdAndReviewerChannelIdAndReviewedChannelId(
                            sessionId, channelId, entry.getReviewedChannelId())
                    .orElseGet(() -> PeerReview.builder()
                            .assignmentSessionId(sessionId)
                            .reviewerChannelId(channelId)
                            .reviewedChannelId(entry.getReviewedChannelId())
                            .submittedAt(now)
                            .build());

            review.setSubmittedByUserId(currentUserId);
            review.setScore(entry.getScore());
            review.setComment(entry.getComment());
            review.setUpdatedAt(now);
            if (review.getSubmittedAt() == null) review.setSubmittedAt(now);

            PeerReview saved = peerReviewRepository.save(review);
            savedReviews.add(saved);

            List<String> reviewedUserIds = getActiveUserIds(entry.getReviewedChannelId());
            notifyReviewedMembers(saved.getId(), channelId, entry.getReviewedChannelId(),
                    reviewerChannel.getName(), saved.getScore(), saved.getComment(),
                    reviewedUserIds, currentUserId);
        }

        return toBatchResponse(channelId, sessionId, currentUserId, savedReviews, now);
    }

    // ─────────────────────────────────────────────────────────────────────
    // UC-41 Tính điểm cuối cùng (on-demand, trước khi collect chính thức)
    // ─────────────────────────────────────────────────────────────────────

    @Override
    public FinalScoreResponse calculateFinalScore(String channelId) {
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new AppException(ErrorCode.UN_EXISTING_CHANNEL));

        String sessionId = channel.getAssignmentSessionId();
        if (sessionId == null) {
            throw new AppException(ErrorCode.ASSIGNMENT_SESSION_NOT_FOUND);
        }

        List<PeerReview> allReviews = peerReviewRepository.findAllByAssignmentSessionId(sessionId);

        Double selfScore = null;
        List<Double> peerScores = new ArrayList<>();

        for (PeerReview review : allReviews) {
            if (!channelId.equals(review.getReviewedChannelId())) continue;
            if (channelId.equals(review.getReviewerChannelId())) {
                selfScore = review.getScore();
            } else {
                peerScores.add(review.getScore());
            }
        }

        Double medianScore = peerScores.isEmpty() ? null : calcMedian(peerScores);

        Double finalScore;
        boolean usedSelfScore = false;

        if (medianScore == null) {
            finalScore = selfScore;
            usedSelfScore = selfScore != null;
        } else if (selfScore == null) {
            finalScore = medianScore;
        } else {
            if (Math.abs(selfScore - medianScore) <= 0.5) {
                finalScore = selfScore;
                usedSelfScore = true;
            } else {
                finalScore = medianScore;
            }
        }

        return FinalScoreResponse.builder()
                .channelId(channelId)
                .selfScore(selfScore)
                .medianScore(medianScore)
                .finalScore(finalScore)
                .usedSelfScore(usedSelfScore)
                .reviewerCount(peerScores.size())
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────
    // Prefill form chấm chéo
    // ─────────────────────────────────────────────────────────────────────

    @Override
    public List<CrossReviewScoreResponse> getMyReviews(String channelId) {
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new AppException(ErrorCode.UN_EXISTING_CHANNEL));
        String sessionId = channel.getAssignmentSessionId();
        if (sessionId == null) return List.of();
        return peerReviewRepository
                .findAllByAssignmentSessionIdAndReviewerChannelId(sessionId, channelId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // ─────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────

    private List<String> getActiveUserIds(String channelId) {
        return channelMemberRepository.findByChannelIdAndStatus(channelId, MemberStatus.ACTIVE)
                .stream()
                .map(ChannelMember::getUserId)
                .toList();
    }

    private void notifyReviewedMembers(String scoreId,
                                        String reviewerChannelId,
                                        String reviewedChannelId,
                                        String reviewerName,
                                        Double score,
                                        String comment,
                                        List<String> reviewedUserIds,
                                        String senderId) {
        String displayName = reviewerName != null ? reviewerName : "Nhóm khác";
        String message = String.format("%s đã chấm bài của bạn: %.1f/10 điểm", displayName, score);
        String link = "/workspace/channel/" + reviewedChannelId;

        for (String userId : reviewedUserIds) {
            if (userId == null || userId.isBlank()) continue;
            try {
                notificationRepository.sendNotification(NotificationMessage.builder()
                        .userId(userId)
                        .senderId(senderId)
                        .type("CROSS_REVIEW_SCORED")
                        .message(message)
                        .link(link)
                        .data(CrossReviewNotificationData.builder()
                                .scoreId(scoreId)
                                .reviewerChannelId(reviewerChannelId)
                                .reviewedChannelId(reviewedChannelId)
                                .score(score)
                                .comment(comment)
                                .build())
                        .build());
            } catch (Exception ex) {
                log.warn("Failed to send cross-review notification to userId={}: {}", userId, ex.getMessage());
            }
        }
    }

    private CrossReviewScoreOfGroupResponse toBatchResponse(
            String reviewerChannelId,
            String sessionId,
            String submittedByUserId,
            List<PeerReview> reviews,
            Instant fallbackTime) {

        List<CrossReviewScoreOfGroupResponse.EntryResponse> entries = reviews.stream()
                .map(r -> CrossReviewScoreOfGroupResponse.EntryResponse.builder()
                        .reviewedChannelId(r.getReviewedChannelId())
                        .score(r.getScore())
                        .comment(r.getComment())
                        .build())
                .toList();

        Instant submittedAt = reviews.stream()
                .map(PeerReview::getSubmittedAt)
                .filter(Objects::nonNull)
                .min(Instant::compareTo)
                .orElse(fallbackTime);
        Instant updatedAt = reviews.stream()
                .map(PeerReview::getUpdatedAt)
                .filter(Objects::nonNull)
                .max(Instant::compareTo)
                .orElse(fallbackTime);

        return CrossReviewScoreOfGroupResponse.builder()
                .id(reviews.isEmpty() ? null : reviews.get(0).getId())
                .reviewerChannelId(reviewerChannelId)
                .assignmentSessionId(sessionId)
                .submittedByUserId(submittedByUserId)
                .entries(entries)
                .submittedAt(submittedAt)
                .updatedAt(updatedAt)
                .build();
    }

    private CrossReviewScoreResponse toResponse(PeerReview r) {
        return CrossReviewScoreResponse.builder()
                .id(r.getId())
                .reviewerChannelId(r.getReviewerChannelId())
                .reviewedChannelId(r.getReviewedChannelId())
                .reviewerUserId(r.getSubmittedByUserId())
                .score(r.getScore())
                .comment(r.getComment())
                .submittedAt(r.getSubmittedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }

    private Double calcMedian(List<Double> scores) {
        List<Double> sorted = new ArrayList<>(scores);
        Collections.sort(sorted);
        int n = sorted.size();
        if (n % 2 == 1) return sorted.get(n / 2);
        return (sorted.get(n / 2 - 1) + sorted.get(n / 2)) / 2.0;
    }

    private String currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        return auth.getName();
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    private static class CrossReviewNotificationData {
        private String scoreId;
        private String reviewerChannelId;
        private String reviewedChannelId;
        private Double score;
        private String comment;
    }
}
