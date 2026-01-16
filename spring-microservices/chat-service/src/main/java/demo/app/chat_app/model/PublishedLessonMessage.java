package demo.app.chat_app.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "published_course_lesson_discussion")
public class PublishedLessonMessage {
    
    @Id
    private String id;
    
    private Integer lessonId;
    
    private Integer publishedCourseId;
    
    private String userId;
    
    private String userName;
    
    private String userAvatar;
    
    private String content;
    
    private String imageUrl;
    
    @Builder.Default
    private Integer likes = 0;
    
    @Builder.Default
    private List<String> likedBy = new ArrayList<>();
    
    private LocalDateTime createdAt;
}
