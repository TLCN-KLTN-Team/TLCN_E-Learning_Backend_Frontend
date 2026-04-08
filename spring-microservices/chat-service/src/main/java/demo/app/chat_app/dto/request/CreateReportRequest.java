package demo.app.chat_app.dto.request;

import demo.app.chat_app.model.forum.ReportTargetType;
import demo.app.chat_app.model.forum.ViolationReason;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateReportRequest {
    String targetId; // Post or Comment ID
    ReportTargetType targetType;
    ViolationReason reason;
    String notes; // Optional supplementary notes
}
