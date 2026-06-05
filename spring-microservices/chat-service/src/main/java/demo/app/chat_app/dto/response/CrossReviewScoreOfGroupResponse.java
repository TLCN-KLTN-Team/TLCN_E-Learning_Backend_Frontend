package demo.app.chat_app.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CrossReviewScoreOfGroupResponse {

    private String id;
    private String reviewerChannelId;
    private String assignmentSessionId;
    private String submittedByUserId;
    private List<EntryResponse> entries;
    private Instant submittedAt;
    private Instant updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EntryResponse {
        private String reviewedChannelId;
        private Double score;
        private String comment;
    }
}
