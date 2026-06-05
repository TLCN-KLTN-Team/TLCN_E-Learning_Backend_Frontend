package demo.app.chat_app.model.workspace;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.MongoId;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Phiên làm bài tập nhóm (UC-41).
 *
 * Được tạo một lần khi giáo viên gọi bulkRandomlyCreateChannels.
 * Mỗi Channel GROUP trong batch sẽ trỏ về cùng một AssignmentSession
 * qua trường assignmentSessionId.
 *
 * Vòng đời:
 *   1. OPEN     — trước submissionDeadline, các nhóm đang làm bài
 *   2. REVIEW   — sau submissionDeadline (nếu allowCrossReview=true), chờ chấm chéo
 *   3. COMPLETED— sau crossReviewDeadline, giáo viên chấm điểm tổng kết
 */
@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "assignment_sessions")
@FieldDefaults(level = AccessLevel.PRIVATE)
@CompoundIndex(name = "session_section_created_idx", def = "{'sectionId': 1, 'createdAt': -1}")
public class AssignmentSession {

    @MongoId
    String id;

    String sectionId;
    String workspaceId;

    String name;
    String description;

    Instant submissionDeadline;
    Instant crossReviewDeadline;

    @Builder.Default
    boolean allowCrossReview = false;

    /** Tất cả Channel GROUP thuộc phiên này. Được điền sau khi tạo xong toàn bộ channels. */
    @Builder.Default
    List<String> channelIds = new ArrayList<>();

    /** Các Channel đã chốt nộp bài (submitPractices đã được gọi). */
    @Builder.Default
    List<String> submittedChannelIds = new ArrayList<>();

    /** MessageId của các file SUBMISSION đã được nộp lên bất kỳ channel nào trong phiên này. */
    @Builder.Default
    List<String> submittedFileMessageIds = new ArrayList<>();

    String createdByUserId;
    Instant createdAt;
    Instant updatedAt;

    /** Trạng thái thu thập điểm cuối sau khi crossReviewDeadline qua. */
    @Builder.Default
    ScoreCollectionStatus scoreCollectionStatus = ScoreCollectionStatus.PENDING;

    /** Thời điểm thu thập điểm thành công. */
    Instant scoreCollectedAt;

    /** Thông báo lỗi lần thu thập gần nhất (null nếu thành công). */
    String scoreCollectionError;
}
