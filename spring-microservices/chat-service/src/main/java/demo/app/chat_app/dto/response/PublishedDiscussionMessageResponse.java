package demo.app.chat_app.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublishedDiscussionMessageResponse {
    private String id;
    private Integer quizId;
    private Integer assignmentId;
    private Integer lessonId;
    private Integer publishedCourseId;
    private String userId;
    private String userName;
    private String userAvatar;
    private String content;
    private String imageUrl;
    private Integer likes;
    private List<String> likedBy;
    private LocalDateTime createdAt;
}
