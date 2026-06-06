package demo.app.chat_app.model.workspace;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.MongoId;

import java.time.Instant;

/**
 * UC-41 — Một cặp chấm chéo (reviewer → reviewed) trong một phiên làm bài.
 *
 * Thay thế CrossReviewScore + CrossReviewScoreOfGroup.
 * Unique index trên (assignmentSessionId, reviewerChannelId, reviewedChannelId)
 * — submit lại thì upsert, không tạo document mới.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "peer_reviews")
@FieldDefaults(level = AccessLevel.PRIVATE)
@CompoundIndexes({
        @CompoundIndex(name = "session_reviewer_reviewed_unique",
                def = "{'assignmentSessionId': 1, 'reviewerChannelId': 1, 'reviewedChannelId': 1}",
                unique = true),
        @CompoundIndex(name = "session_reviewed_idx",
                def = "{'assignmentSessionId': 1, 'reviewedChannelId': 1}"),
        @CompoundIndex(name = "session_reviewer_idx",
                def = "{'assignmentSessionId': 1, 'reviewerChannelId': 1}")
})
public class PeerReview {

    @MongoId
    String id;

    String assignmentSessionId;

    /** Channel của nhóm thực hiện chấm. */
    String reviewerChannelId;

    /** Channel của nhóm bị chấm. */
    String reviewedChannelId;

    /** userId thành viên nhấn submit. */
    String submittedByUserId;

    Double score;
    String comment;

    Instant submittedAt;
    Instant updatedAt;
}
