package demo.app.chat_app.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CrossReviewScoreResponse {
    private String id;
    private String reviewerChannelId;
    private String reviewedChannelId;
    private String reviewerUserId;
    private Double score;
    private String comment;
    private Instant submittedAt;
    private Instant updatedAt;
}
