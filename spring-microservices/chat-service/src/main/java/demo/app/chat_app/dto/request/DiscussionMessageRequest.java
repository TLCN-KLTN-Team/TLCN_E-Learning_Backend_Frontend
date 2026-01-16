package demo.app.chat_app.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DiscussionMessageRequest {
    
    @NotBlank(message = "Message content is required")
    private String content;
    
    private String parentMessageId; // For replies/threads
    
    private String userId; // Will be set from authentication
    
    private String userName; // Will be fetched from user service
    
    private String userAvatar; // User avatar URL
    
    private String imageUrl; // Optional image attachment
}
