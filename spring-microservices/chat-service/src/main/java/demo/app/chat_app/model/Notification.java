package demo.app.chat_app.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "notifications")
@CompoundIndexes({
        @CompoundIndex(name = "userId_isRead_createdAt", def = "{'userId': 1, 'isRead': 1, 'createdAt': -1}"),
        @CompoundIndex(name = "userId_type_createdAt", def = "{'userId': 1, 'type': 1, 'createdAt': -1}")
})
public class Notification {
    @Id
    private String id;

    @Indexed
    private String userId;

    private NotificationType type;

    private String title;

    private String message;

    private NotificationData data;

    @Indexed
    private Boolean isRead = false;

    private Instant readAt;

    private NotificationPriority priority = NotificationPriority.MEDIUM;

    private String actionUrl;

    @Indexed(expireAfter = "0s")
    private Instant expiresAt;

    private Instant createdAt;

    private Instant updatedAt;

    public enum NotificationType {
        COURSE_PURCHASED,
        COURSE_ENROLLED,
        LESSON_COMPLETED,
        CERTIFICATE_EARNED,
        COURSE_UPDATED,
        ASSIGNMENT_GRADED,
        COMMENT_REPLY,
        COURSE_REMINDER,
        PROMOTION
    }

    public enum NotificationPriority {
        LOW, MEDIUM, HIGH, URGENT
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NotificationData {
        private String courseId;
        private String orderId;
        private String lessonId;
        private String certificateId;
        private String assignmentId;
        private String commentId;
        private Map<String, Object> additionalInfo;
    }

    public void markAsRead() {
        this.isRead = true;
        this.readAt = Instant.now();
    }
}
