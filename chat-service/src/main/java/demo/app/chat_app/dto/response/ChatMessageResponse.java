package demo.app.chat_app.dto.response;

import demo.app.chat_app.model.Participant;
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
    String channelId;
    boolean me;
    String content;
    Participant sender;
    Instant createdDate;
    MessageType messageType;
    List<AttachmentResponse> attachments;
}
