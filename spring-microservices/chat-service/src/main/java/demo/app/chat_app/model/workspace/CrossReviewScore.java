package demo.app.chat_app.model.workspace;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.MongoId;

import java.time.Instant;
import java.util.List;

/**
 * UC-41 — Bảng điểm chấm chéo giữa các nhóm.
 *
 * Một record = nhóm reviewerChannelId chấm bài của nhóm reviewedChannelId.
 * Mỗi cặp (reviewer, reviewed) chỉ tồn tại tối đa 1 record — submit lại sẽ
 * upsert (ghi đè score + comment + submittedAt) khi vẫn còn trong phase REVIEW.
 *
 * reviewedUserIds được denormalize tại thời điểm submit để có thể query nhanh
 * "tất cả điểm chấm chéo của một sinh viên" (= hồ sơ sinh viên) mà không cần
 * JOIN qua ChannelMember.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "cross_review_scores")
@FieldDefaults(level = AccessLevel.PRIVATE)
@CompoundIndexes({
        @CompoundIndex(name = "reviewer_reviewed_unique",
                def = "{'reviewerChannelId': 1, 'reviewedChannelId': 1}", unique = true),
        @CompoundIndex(name = "reviewed_channel_idx", def = "{'reviewedChannelId': 1}")
})
public class CrossReviewScore {

    @MongoId
    String id;

    private String reviewerChannelId; // Channel của nhóm thực hiện chấm
    private String reviewedChannelId; // Channel của nhóm bị chấm

    private String reviewerUserId;    // userId của thành viên submit form
    @Indexed
    private List<String> reviewedUserIds; // Snapshot userId của nhóm bị chấm tại thời điểm submit

    private Double score;   // 0.0 – 10.0
    private String comment;

    private Instant submittedAt;
    private Instant updatedAt;
}
