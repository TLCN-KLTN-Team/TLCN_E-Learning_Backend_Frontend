package demo.app.chat_app.events;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Student info từ Kafka event
 * Sync với course-service/events/StudentInfo.java
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentInfo {
    private String userId;
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    private String avatarUrl;
    private String studentId;
}
