package demo.app.chat_app.dto.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

/**
 * Payload Kafka event "ASSIGNMENT_SESSION_CREATED".
 *
 * <p>Publish khi giáo viên tạo phiên bài tập nhóm (bulkRandomlyCreateChannels). course-service dùng
 * để tạo sẵn một GroupAssignment cho mỗi nhóm (channel) ở trạng thái SUBMISSION, chưa có điểm.</p>
 *
 * <p>Đi cùng topic {@code score-events} và cùng key = sessionId với SCORE_CALCULATED → xử lý tuần tự
 * per-phiên (tạo trước, chấm sau).</p>
 *
 * <p>Envelope Kafka: {@code { "eventId": "<UUID>", "eventType": "ASSIGNMENT_SESSION_CREATED", "data": {...} }}</p>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignmentSessionCreatedEvent {

    /** Id AssignmentSession — khóa định danh GroupAssignment ở course-service. */
    String sessionId;

    String sectionId;
    String workspaceId;

    /** CourseClass đích bên course-service (Section.classId). */
    Integer classId;

    /** Course đích bên course-service (Workspace.courseId). */
    Integer courseId;

    String name;
    String description;

    Instant submissionDeadline;
    Instant crossReviewDeadline;

    /** Thang điểm tối đa của bài tập nhóm. */
    Integer maxScore;

    /** Mỗi nhóm trong phiên — course-service tạo một GroupAssignment tương ứng. */
    List<GroupEntry> groups;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GroupEntry {
        String channelId;
        List<String> memberUserIds;
    }
}
