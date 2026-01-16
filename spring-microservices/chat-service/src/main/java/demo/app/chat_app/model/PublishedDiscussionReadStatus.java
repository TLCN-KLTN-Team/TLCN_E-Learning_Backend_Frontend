package demo.app.chat_app.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "published_course_discussion_read_status")
public class PublishedDiscussionReadStatus {
    
    @Id
    private String id;
    
    private String userId;
    
    private Integer publishedCourseId;
    
    private Integer quizId;
    
    private Integer assignmentId;
    
    private Integer lessonId;
    
    private LocalDateTime lastReadAt;
}
