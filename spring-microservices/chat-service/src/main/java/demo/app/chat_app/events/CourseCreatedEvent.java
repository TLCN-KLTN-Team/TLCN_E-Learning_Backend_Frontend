package demo.app.chat_app.events;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseCreatedEvent {
    private String eventId;
    private Integer courseId;
    private String courseAvatarUrl;
    private String courseName;
    private String description;
    private String instructorId;
    private List<String> studentIds;
    private LocalDateTime createdAt;
    private LocalDateTime endedAt; // time course ends
    @Builder.Default
    private String eventType = "COURSE_CREATED";
}
