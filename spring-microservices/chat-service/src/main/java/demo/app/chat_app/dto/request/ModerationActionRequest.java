package demo.app.chat_app.dto.request;

import demo.app.chat_app.model.forum.ReportStatus;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ModerationActionRequest {
    String targetId; // Post or Comment ID
    String actionType; // LOCK, UNLOCK, PIN, UNPIN, HIDE, APPROVE, RESOLVE_REPORT, DELETE
    String moderatorNotes; // Optional notes on action
    ReportStatus reportStatus; // For report actions
}
