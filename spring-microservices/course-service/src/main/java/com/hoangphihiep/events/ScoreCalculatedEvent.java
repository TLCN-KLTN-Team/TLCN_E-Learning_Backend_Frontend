package com.hoangphihiep.events;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

/**
 * Payload của Kafka event "SCORE_CALCULATED" — mirror DTO phía chat-service.
 *
 * <p>Bài tập nhóm (UC-41) được tạo và quản lý hoàn toàn ở chat-service (AssignmentSession).
 * course-service KHÔNG có sẵn một Assignment tương ứng — vì thế event mang theo đầy đủ
 * metadata của phiên để course-service tự upsert một {@code GroupAssignment} (định danh theo
 * {@code sessionId}) rồi ghi điểm vào đó. Đây là lý do bỏ {@code courseAssignmentId} cũ.</p>
 *
 * <p>Envelope trên Kafka: {@code KafkaEvent<ScoreCalculatedEvent>} (eventId/eventType/data).</p>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScoreCalculatedEvent {

    /** Id của AssignmentSession bên chat-service — khóa định danh GroupAssignment ở course-service. */
    private String sessionId;

    /** Id Mongo của section chat-service (chỉ để tham chiếu/log). */
    private String sectionId;

    /** Id Mongo của workspace chat-service (chỉ để tham chiếu/log). */
    private String workspaceId;

    // ── Metadata của bài tập nhóm — dùng để dựng GroupAssignment ở course-service ──

    /** CourseClass đích bên course-service (Section.classId của chat-service). */
    private Integer classId;

    /** Course đích bên course-service (Workspace.courseId của chat-service). */
    private Integer courseId;

    private String name;
    private String description;

    private Instant submissionDeadline;
    private Instant crossReviewDeadline;

    /** Thang điểm tối đa của bài tập nhóm (mặc định 10 nếu null). */
    private Integer maxScore;

    /** Điểm cuối từng nhóm — gồm cả nhóm status != CALCULATED (finalScore khi đó null). */
    private List<ScoreEntry> scores;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScoreEntry {
        private String channelId;
        private List<String> memberUserIds;
        /** null nếu status = NO_SUBMISSION hoặc NO_PEERS. */
        private Double finalScore;
        /** CALCULATED | NO_SUBMISSION | NO_PEERS | SENT_TO_LMS */
        private String status;
        /** Các đánh giá nhóm nhận được — chỉ nội dung nhận xét (không kèm nhóm chấm). */
        private List<String> comments;
    }
}
