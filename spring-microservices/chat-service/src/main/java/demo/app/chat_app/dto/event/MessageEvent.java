package demo.app.chat_app.dto.event;

import com.fasterxml.jackson.annotation.JsonInclude;
import demo.app.chat_app.dto.response.ChatMessageResponse;
import lombok.*;
import lombok.experimental.FieldDefaults;

/**
 * Wrapper event broadcast via WebSocket.
 * Frontend uses the 'type' field to switch handling:
 * - "NEW_MESSAGE": contains full ChatMessageResponse in 'message'
 * - "MESSAGE_UPDATED": contains MessageUpdatePayload in 'update'
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class MessageEvent {
    String type; // "NEW_MESSAGE" | "MESSAGE_UPDATED"
    ChatMessageResponse message; // full message for NEW_MESSAGE
    MessageUpdatePayload update; // for MESSAGE_UPDATED only

    public static MessageEvent newMessage(ChatMessageResponse response) {
        return MessageEvent.builder()
                .type("NEW_MESSAGE")
                .message(response)
                .build();
    }

    public static MessageEvent messageUpdated(MessageUpdatePayload payload) {
        return MessageEvent.builder()
                .type("MESSAGE_UPDATED")
                .update(payload)
                .build();
    }
}
