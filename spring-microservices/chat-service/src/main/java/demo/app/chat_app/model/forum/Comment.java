package demo.app.chat_app.model.forum;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "forum_comments")
public class Comment {
    @Id
    private String id;
    private String postId;
    private String userId;
    private String authorUsername;
    private String authorName;
    private String authorAvatar;
    private String content;
    
    private String replyToId; // Parent comment ID (for nested replies)
    
    @CreatedDate
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;

    @Transient
    private long upvotes;

    @Transient
    private long downvotes;

    @Transient
    private long score;

    @Transient
    private boolean isLiked;
    
    // Moderation fields
    private ModerationStatus moderationStatus; // Approval status
    
    // Soft delete for audit trail
    private boolean deleted;
    private LocalDateTime deletedAt;
}
