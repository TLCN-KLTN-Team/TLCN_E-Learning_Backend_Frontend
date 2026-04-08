package demo.app.chat_app.model.forum;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "forum_violation_reports")
public class ForumViolationReport {
    @Id
    private String id;
    private String reporterId;
    private String targetId; // Post ID or Comment ID
    private ReportTargetType targetType; // POST or COMMENT
    private ViolationReason reason;
    private String notes; // Supplementary notes from reporter
    
    @CreatedDate
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    private LocalDateTime updatedAt;
    
    private ReportStatus status;
    private String moderatorId; // SuperAdmin who handled this report
    private String moderatorNotes; // SuperAdmin resolution notes
    
    // For audit trail
    private boolean deleted; // Soft delete flag
    private LocalDateTime deletedAt;
}
