package demo.app.chat_app.dto.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

/**
 * Payload của Kafka event "SCORE_CALCULATED".
 *
 * <p>Được publish bởi chat-service sau khi giáo viên duyệt và gửi điểm chấm chéo nhóm.
 * Bài tập nhóm (AssignmentSession) chỉ tồn tại ở chat-service nên course-service KHÔNG có sẵn
 * Assignment tương ứng — vì vậy event mang theo đầy đủ metadata của phiên để course-service tự
 * dựng một GroupAssignment (định danh theo {@code sessionId}) rồi ghi điểm vào đó.</p>
 *
 * <p>Envelope trên Kafka:
 * <pre>{ "eventId": "&lt;UUID&gt;", "eventType": "SCORE_CALCULATED", "data": { ... } }</pre></p>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScoreCalculatedEvent {

    /** Id AssignmentSession — khóa định danh GroupAssignment ở course-service. */
    String sessionId;

    /** Id Mongo section/workspace của chat-service (tham chiếu/log). */
    String sectionId;
    String workspaceId;

    // ── Metadata bài tập nhóm — course-service dùng để dựng GroupAssignment ──

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

    /** Điểm cuối cùng từng nhóm — bao gồm cả nhóm không đủ điều kiện (status != CALCULATED). */
    List<ScoreEntry> scores;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScoreEntry {
        String channelId;
        List<String> memberUserIds;
        /** null nếu status = NO_SUBMISSION hoặc NO_PEERS */
        Double finalScore;
        /** CALCULATED | NO_SUBMISSION | NO_PEERS */
        String status;
        /** Các đánh giá nhóm nhận được — chỉ nội dung nhận xét (không kèm nhóm chấm). */
        List<String> comments;
    }
}
