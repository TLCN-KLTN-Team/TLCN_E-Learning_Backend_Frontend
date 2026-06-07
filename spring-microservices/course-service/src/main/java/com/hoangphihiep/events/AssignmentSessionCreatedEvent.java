package com.hoangphihiep.events;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

/**
 * Payload Kafka event "ASSIGNMENT_SESSION_CREATED" — mirror DTO phía chat-service.
 *
 * <p>Được publish khi giáo viên tạo phiên bài tập nhóm (AssignmentSession). course-service tạo sẵn
 * một {@code GroupAssignment} cho mỗi nhóm (channel) với {@code status = SUBMISSION}, chưa có điểm,
 * để UI biết phiên đã mở. Điểm & đánh giá được điền sau qua {@code SCORE_CALCULATED}.</p>
 *
 * <p>Đi cùng topic {@code score-events} với {@code SCORE_CALCULATED}, cùng key = sessionId, nên
 * được xử lý tuần tự per-phiên (tạo trước, chấm sau).</p>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignmentSessionCreatedEvent {

    /** Id AssignmentSession bên chat-service — khóa định danh GroupAssignment ở course-service. */
    private String sessionId;

    private String sectionId;
    private String workspaceId;

    /** CourseClass đích bên course-service (Section.classId). */
    private Integer classId;

    /** Course đích bên course-service (Workspace.courseId). */
    private Integer courseId;

    private String name;
    private String description;

    private Instant submissionDeadline;
    private Instant crossReviewDeadline;

    /** Thang điểm tối đa của bài tập nhóm (mặc định 10 nếu null). */
    private Integer maxScore;

    /** Mỗi nhóm trong phiên — tạo một GroupAssignment tương ứng. */
    private List<GroupEntry> groups;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GroupEntry {
        private String channelId;
        private List<String> memberUserIds;
    }
}
