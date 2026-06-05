package demo.app.chat_app.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

/**
 * UC-41 — Kết quả điểm cuối cùng của một nhóm sau giai đoạn chấm chéo.
 * Trả về bởi endpoint GET/POST /sessions/{id}/collect-scores.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupFinalScoreResponse {

    String id;
    String assignmentSessionId;
    String channelId;
    String sectionId;

    List<PeerScoreEntryResponse> peerScores;
    Double selfScore;
    Double medianPeerScore;
    Double finalScore;
    boolean usedSelfScore;
    int reviewerCount;

    List<String> memberUserIds;

    /** CALCULATED | NO_SUBMISSION | NO_PEERS | SENT_TO_LMS */
    String status;

    Instant calculatedAt;
    Instant sentToLmsAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PeerScoreEntryResponse {
        String reviewerChannelId;
        Double score;
        String comment;
        Instant submittedAt;
    }
}
