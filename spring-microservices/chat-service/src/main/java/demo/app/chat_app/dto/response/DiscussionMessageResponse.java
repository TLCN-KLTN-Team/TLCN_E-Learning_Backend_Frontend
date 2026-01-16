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
public class DiscussionMessageResponse {
    
    private String id;
    private Integer quizId;
    private Integer assignmentId;
    private Integer lessonId;
    private String userId;
    private String userName;
    private String userAvatar;
    private String userRole; // STUDENT, TEACHER, ADMIN
    private String content;
    private String imageUrl; // Image attachment URL
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Integer likes;
    private Boolean isLiked; // by current user
    private Boolean isOwner; // is current user the owner
    private String parentMessageId;
    private List<DiscussionMessageResponse> replies; // nested replies
    private Boolean isDeleted;
}
