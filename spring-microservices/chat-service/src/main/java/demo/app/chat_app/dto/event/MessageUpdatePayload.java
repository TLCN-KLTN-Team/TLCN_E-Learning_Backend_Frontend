package demo.app.chat_app.dto.event;

import demo.app.chat_app.dto.response.AttachmentResponse;
import demo.app.chat_app.model.enums.MessageStatus;
import demo.app.chat_app.model.enums.MessageType;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

/**
 * Payload for MESSAGE_UPDATED events.
 * Contains the clientMessageId for frontend merge and the list of newly uploaded attachments.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class MessageUpdatePayload {
    String clientMessageId;
    String messageId;
    MessageStatus status;
    MessageType messageType;
    List<AttachmentResponse> attachments;
}
