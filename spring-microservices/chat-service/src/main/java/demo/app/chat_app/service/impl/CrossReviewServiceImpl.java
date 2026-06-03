package demo.app.chat_app.service.impl;

import demo.app.chat_app.dto.request.CrossReviewSubmitRequest;
import demo.app.chat_app.dto.request.NotificationMessage;
import demo.app.chat_app.dto.response.CrossReviewScoreResponse;
import demo.app.chat_app.exception.AppException;
import demo.app.chat_app.exception.ErrorCode;
import demo.app.chat_app.model.workspace.Channel;
import demo.app.chat_app.model.workspace.ChannelMember;
import demo.app.chat_app.model.workspace.CrossReviewScore;
import demo.app.chat_app.model.workspace.MemberStatus;
import demo.app.chat_app.repository.AssignmentSessionRepository;
import demo.app.chat_app.repository.ChannelMemberRepository;
import demo.app.chat_app.repository.ChannelRepository;
import demo.app.chat_app.repository.CrossReviewScoreRepository;
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
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CrossReviewServiceImpl implements CrossReviewService {

    ChannelRepository channelRepository;
    AssignmentSessionRepository assignmentSessionRepository;
    ChannelMemberRepository channelMemberRepository;
    CrossReviewScoreRepository scoreRepository;
    NotificationRepository notificationRepository;

    @Override
    @Transactional
    public CrossReviewScoreResponse submitReview(String channelId, CrossReviewSubmitRequest request) {
        String currentUserId = currentUserId();

        Channel reviewerChannel = channelRepository.findById(channelId)
                .orElseThrow(() -> new AppException(ErrorCode.UN_EXISTING_CHANNEL));

        if (!reviewerChannel.isAllowCrossReview()) {
            throw new AppException(ErrorCode.CROSS_REVIEW_NOT_ALLOWED);
        }

        String reviewedChannelId = request.getReviewedChannelId();

        // Validate reviewed channel thuộc cùng AssignmentSession.
        if (reviewerChannel.getAssignmentSessionId() == null) {
            throw new AppException(ErrorCode.ASSIGNMENT_SESSION_NOT_FOUND);
        }
        boolean sameSession = assignmentSessionRepository
                .findById(reviewerChannel.getAssignmentSessionId())
                .map(s -> s.getChannelIds() != null && s.getChannelIds().contains(reviewedChannelId))
                .orElse(false);
        if (!sameSession) {
            throw new AppException(ErrorCode.NO_CROSS_REVIEW_TARGET);
        }
        // Chỉ cho phép chấm trong phase REVIEW.
        if (ChannelPhase.of(reviewerChannel, Instant.now()) != ChannelPhase.REVIEW) {
            throw new AppException(ErrorCode.CHANNEL_LOCKED);
        }

        // Người submit phải là thành viên ACTIVE của reviewerChannel.
        ChannelMember reviewerMember = channelMemberRepository
                .findByChannelIdAndUserId(channelId, currentUserId)
                .orElseThrow(() -> new AppException(ErrorCode.CROSS_REVIEW_NOT_MEMBER));
        if (reviewerMember.getStatus() != MemberStatus.ACTIVE) {
            throw new AppException(ErrorCode.CROSS_REVIEW_NOT_MEMBER);
        }

        if (request.getScore() == null || request.getScore() < 0.0 || request.getScore() > 10.0) {
            throw new AppException(ErrorCode.CROSS_REVIEW_SCORE_INVALID);
        }

        // Snapshot userId của nhóm bị chấm để query hồ sơ sinh viên.
        List<ChannelMember> reviewedMembers = channelMemberRepository
                .findByChannelIdAndStatus(reviewedChannelId, MemberStatus.ACTIVE);
        List<String> reviewedUserIds = reviewedMembers.stream()
                .map(ChannelMember::getUserId)
                .toList();

        Instant now = Instant.now();
        CrossReviewScore score = scoreRepository
                .findByReviewerChannelIdAndReviewedChannelId(channelId, reviewedChannelId)
                .orElseGet(() -> CrossReviewScore.builder()
                        .reviewerChannelId(channelId)
                        .reviewedChannelId(reviewedChannelId)
                        .submittedAt(now)
                        .build());

        score.setReviewerUserId(currentUserId);
        score.setReviewedUserIds(reviewedUserIds);
        score.setScore(request.getScore());
        score.setComment(request.getComment());
        score.setUpdatedAt(now);
        if (score.getSubmittedAt() == null) {
            score.setSubmittedAt(now);
        }

        CrossReviewScore saved = scoreRepository.save(score);

        notifyReviewedMembers(saved, reviewerChannel, currentUserId);

        return toResponse(saved);
    }

    @Override
    public List<CrossReviewScoreResponse> getMyReviews(String channelId) {
        channelRepository.findById(channelId)
                .orElseThrow(() -> new AppException(ErrorCode.UN_EXISTING_CHANNEL));
        return scoreRepository.findAllByReviewerChannelId(channelId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public List<CrossReviewScoreResponse> getScoresForStudent(String userId) {
        return scoreRepository.findByReviewedUserIdsContaining(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    // ─────────────────────────────────────────────────────────────────────

    private void notifyReviewedMembers(CrossReviewScore saved, Channel reviewerChannel, String senderId) {
        String reviewerName = reviewerChannel.getName() != null ? reviewerChannel.getName() : "Nhóm khác";
        String message = String.format(
                "%s đã chấm bài của bạn: %.1f/10 điểm",
                reviewerName, saved.getScore());
        String link = "/workspace/channel/" + saved.getReviewedChannelId();

        for (String userId : saved.getReviewedUserIds()) {
            if (userId == null || userId.isBlank()) continue;
            try {
                notificationRepository.sendNotification(NotificationMessage.builder()
                        .userId(userId)
                        .senderId(senderId)
                        .type("CROSS_REVIEW_SCORED")
                        .message(message)
                        .link(link)
                        .data(CrossReviewNotificationData.builder()
                                .scoreId(saved.getId())
                                .reviewerChannelId(saved.getReviewerChannelId())
                                .reviewedChannelId(saved.getReviewedChannelId())
                                .score(saved.getScore())
                                .comment(saved.getComment())
                                .build())
                        .build());
            } catch (Exception ex) {
                log.warn("Failed to send cross-review notification to userId={}: {}", userId, ex.getMessage());
            }
        }
    }

    private CrossReviewScoreResponse toResponse(CrossReviewScore s) {
        return CrossReviewScoreResponse.builder()
                .id(s.getId())
                .reviewerChannelId(s.getReviewerChannelId())
                .reviewedChannelId(s.getReviewedChannelId())
                .reviewerUserId(s.getReviewerUserId())
                .score(s.getScore())
                .comment(s.getComment())
                .submittedAt(s.getSubmittedAt())
                .updatedAt(s.getUpdatedAt())
                .build();
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
