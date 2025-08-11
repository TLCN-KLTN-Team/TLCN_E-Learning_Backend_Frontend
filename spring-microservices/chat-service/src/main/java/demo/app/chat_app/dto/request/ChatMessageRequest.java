package demo.app.chat_app.dto.request;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ChatMessageRequest {
    String channelId;
    String content; // Renamed from 'message' to 'content' to match usage
    String recipientId; // For direct messages
    String messageType; // TEXT, IMAGE, FILE, etc.
}
