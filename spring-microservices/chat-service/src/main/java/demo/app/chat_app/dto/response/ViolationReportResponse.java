package demo.app.chat_app.dto.response;

import demo.app.chat_app.model.forum.ReportStatus;
import demo.app.chat_app.model.forum.ReportTargetType;
import demo.app.chat_app.model.forum.ViolationReason;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ViolationReportResponse {
    String id;
    String reporterId;
    String reporterName;
    String targetId;
    ReportTargetType targetType;
    ViolationReason reason;
    String notes;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
    ReportStatus status;
    String moderatorId;
    String moderatorNotes;
}
