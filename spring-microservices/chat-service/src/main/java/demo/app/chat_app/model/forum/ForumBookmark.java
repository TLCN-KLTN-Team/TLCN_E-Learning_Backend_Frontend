package demo.app.chat_app.model.forum;

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
@Document(collection = "forum_bookmarks")
public class ForumBookmark {
    @Id
    private String id;

    private String userId;

    private Post post;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
