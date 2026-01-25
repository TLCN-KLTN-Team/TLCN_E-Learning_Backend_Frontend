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
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "forum_posts")
public class Post {
    @Id
    private String id;
    private String title;
    private String content; // HTML/Markdown
    private String userId;
    private String authorName;
    private String authorAvatar;
    private String categoryId;
    
    @CreatedDate
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    private LocalDateTime updatedAt;
    
    private long viewCount;
    private List<String> tags;
    private List<String> recentCommenterAvatars; // Store recent commenter avatars
    
    // Cached counters for performance
    private long score; // upvotes - downvotes
    private long commentCount;
}
