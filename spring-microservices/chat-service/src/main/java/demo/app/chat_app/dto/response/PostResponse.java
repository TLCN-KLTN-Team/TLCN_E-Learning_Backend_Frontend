package demo.app.chat_app.dto.response;

import demo.app.chat_app.model.forum.Post;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PostResponse {
    private Post post; // Or flatten fields if preferred, but wrapping is okay for speed
    private long upvotes;
    private long downvotes;
    private long commentCount;
    private boolean isLiked;
    private String authorName; // If we fetch user details
    private String authorAvatar;
}
