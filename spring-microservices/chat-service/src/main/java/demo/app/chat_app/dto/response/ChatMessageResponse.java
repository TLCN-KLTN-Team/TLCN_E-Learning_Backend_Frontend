package demo.app.chat_app.dto.response;

import demo.app.chat_app.model.enums.MessageStatus;
import demo.app.chat_app.model.enums.MessageType;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ChatMessageResponse {
    String id;
    String clientMessageId;
    String channelId;
    boolean me;
    String content;
    UserResponse sender;
    MessageType messageType;
    MessageStatus status;
    List<AttachmentResponse> attachments;
    Instant createdDate;
    boolean uploadedFiles;
}
