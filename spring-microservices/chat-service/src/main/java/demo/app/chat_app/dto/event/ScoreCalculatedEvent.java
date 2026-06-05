package demo.app.chat_app.dto.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Payload của Kafka event "SCORE_CALCULATED".
 *
 * Được publish bởi chat-service sau khi ScoreCollectionService
 * hoàn thành thu thập điểm cho một AssignmentSession.
 *
 * course-service consume event này để ghi điểm vào gradebook LMS.
 *
 * Envelope trên Kafka:
 * {
 *   "eventId": "<UUID>",
 *   "eventType": "SCORE_CALCULATED",
 *   "data": { ...ScoreCalculatedEvent... }
 * }
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScoreCalculatedEvent {

    String sessionId;
    String sectionId;
    String workspaceId;

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
    }
}
