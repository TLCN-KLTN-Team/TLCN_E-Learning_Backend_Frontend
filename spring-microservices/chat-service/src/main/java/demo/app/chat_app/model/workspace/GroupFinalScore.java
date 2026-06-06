package demo.app.chat_app.model.workspace;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.MongoId;

import java.time.Instant;
import java.util.List;

/**
 * UC-41 — Điểm cuối cùng của một nhóm sau khi thu thập và tính median.
 *
 * Một record = kết quả tổng hợp của một nhóm (channelId) trong một phiên (assignmentSessionId).
 * Được tạo/cập nhật bởi ScoreCollectionService sau khi crossReviewDeadline qua.
 *
 * Đây là cầu nối sang course-service: sau khi status = CALCULATED, hệ thống
 * publish ScoreCalculatedEvent để course-service ghi điểm vào gradebook LMS.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "group_final_scores")
@FieldDefaults(level = AccessLevel.PRIVATE)
@CompoundIndexes({
        @CompoundIndex(name = "session_channel_unique",
                def = "{'assignmentSessionId': 1, 'channelId': 1}", unique = true),
        @CompoundIndex(name = "session_idx", def = "{'assignmentSessionId': 1}")
})
public class GroupFinalScore {

    @MongoId
    String id;

    String assignmentSessionId;

    /** Channel của nhóm được tính điểm. */
    String channelId;

    /** Denormalized để query nhanh theo section/workspace. */
    String sectionId;
    String workspaceId;

    /** Điểm từng nhóm peer đã nộp cho nhóm này. */
    List<PeerScoreEntry> peerScores;

    /** Điểm tự chấm của nhóm (null nếu không có self-review). */
    Double selfScore;

    /** Median của peerScores.score (null nếu NO_PEERS). */
    Double medianPeerScore;

    /** Điểm cuối cùng theo công thức median. Null nếu NO_SUBMISSION hoặc NO_PEERS. */
    Double finalScore;

    /** true nếu finalScore lấy từ selfScore (chênh lệch ≤ 0.5). */
    boolean usedSelfScore;

    /** Snapshot userId của các thành viên nhóm tại thời điểm tính điểm. */
    List<String> memberUserIds;

    CollectStatus status;

    Instant calculatedAt;

    /** Thời điểm đã gửi sang course-service (null nếu chưa). */
    Instant sentToLmsAt;

    /** true nếu giáo viên đã chỉnh sửa finalScore thủ công sau khi tính tự động. */
    boolean manuallyOverridden;

    // ─────────────────────────────────────────────────────────────────────

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PeerScoreEntry {
        String reviewerChannelId;
        Double score;
        String comment;
        Instant submittedAt;
    }

    public enum CollectStatus {
        /** Điểm đã được tính thành công. */
        CALCULATED,
        /** Nhóm chưa nộp bài → không tính điểm. */
        NO_SUBMISSION,
        /** Nhóm đã nộp nhưng chưa có ai chấm chéo. */
        NO_PEERS,
        /** Đã gửi điểm sang course-service thành công. */
        SENT_TO_LMS
    }
}
