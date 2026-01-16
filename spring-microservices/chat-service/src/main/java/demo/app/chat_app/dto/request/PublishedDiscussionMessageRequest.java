package demo.app.chat_app.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublishedDiscussionMessageRequest {
    private String content;
    private String imageUrl;
    private String userName;
    private String userAvatar;
}
