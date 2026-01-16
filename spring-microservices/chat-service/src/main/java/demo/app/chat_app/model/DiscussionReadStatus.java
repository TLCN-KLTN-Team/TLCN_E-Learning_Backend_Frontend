package demo.app.chat_app.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "discussion_read_status")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DiscussionReadStatus {
    
    @Id
    private String id;
    
    private String userId;
    private String itemType; // "quiz" or "assignment"
    private Integer itemId;
    private LocalDateTime lastReadAt;
    private String lastReadMessageId;
}
