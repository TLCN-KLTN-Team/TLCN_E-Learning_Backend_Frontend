package demo.app.chat_app.model.workspace;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.MongoId;

import java.time.Instant;
import java.util.List;

/**
 * UC-41 — Batch điểm chấm chéo của một nhóm trong một phiên làm bài.
 *
 * Một record = nhóm reviewerChannelId đã hoàn tất chấm tất cả các nhóm
 * được phân công trong session và nhấn "Nộp bài chấm".
 *
 * Mỗi reviewerChannelId chỉ có tối đa 1 record per session — nộp lại sẽ
 * upsert (ghi đè toàn bộ entries + updatedAt) khi còn trong phase REVIEW.
 *
 * Dùng cùng với CrossReviewScore (lưu từng cặp reviewer-reviewed) để phục vụ
 * hai use-case khác nhau:
 *  - CrossReviewScore: query nhanh "điểm một cặp nhóm"
 *  - CrossReviewScoreOfGroup: collect toàn bộ điểm 1 nhóm nhận được → tính median
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "cross_review_score_of_group")
@FieldDefaults(level = AccessLevel.PRIVATE)
@CompoundIndex(name = "reviewer_session_unique",
        def = "{'reviewerChannelId': 1, 'assignmentSessionId': 1}", unique = true)
public class CrossReviewScoreOfGroup {

    @MongoId
    String id;

    /** Channel của nhóm thực hiện chấm (người nộp bảng điểm). */
    String reviewerChannelId;

    /** Phiên làm bài mà batch điểm này thuộc về. */
    String assignmentSessionId;

    /** userId thành viên nhấn "Nộp bài chấm". */
    String submittedByUserId;

    /** Danh sách các nhóm được chấm kèm điểm và nhận xét. */
    List<ReviewEntry> entries;

    Instant submittedAt;
    Instant updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReviewEntry {
        String reviewedChannelId;
        Double score;
        String comment;
    }
}
