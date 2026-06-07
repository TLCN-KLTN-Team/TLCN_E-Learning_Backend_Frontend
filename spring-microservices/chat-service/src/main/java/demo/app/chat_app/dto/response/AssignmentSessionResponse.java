package demo.app.chat_app.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;
import java.util.List;

/**
 * Thông tin phiên làm bài tập nhóm trả về cho client.
 *
 * channels          — tất cả kênh nhóm trong phiên này
 * submittedChannelIds — danh sách id các kênh đã chốt nộp bài
 * submittedCount    — số nhóm đã nộp (= submittedChannelIds.size())
 * totalChannels     — tổng số nhóm trong phiên
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AssignmentSessionResponse {
    String id;
    String sectionId;

    /** ID lớp học bên course-service (Section.classId) — FE dùng để liệt kê Assignment khi gửi điểm sang LMS. */
    Integer classId;

    String name;
    String description;

    Instant submissionDeadline;
    Instant crossReviewDeadline;
    boolean allowCrossReview;

    List<BasicChannelResponse> channels;
    List<String> submittedChannelIds;

    int totalChannels;
    int submittedCount;

    /** "PENDING" | "COLLECTING" | "COLLECTED" | "FAILED" | null */
    String scoreCollectionStatus;
    String scoreCollectionError;
    Instant scoreCollectedAt;

    Instant createdAt;
}
