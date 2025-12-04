package demo.app.chat_app.model;

import demo.app.chat_app.model.enums.MessageStatus;
import demo.app.chat_app.model.enums.MessageType;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.MongoId;

import java.time.Instant;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
// Compound indexes for efficient queries
@CompoundIndex(def = "{'channelId': 1, 'createdDate': -1}")
@CompoundIndex(def = "{'channelId': 1, 'sender.userId': 1, 'createdDate': -1}")
@Document(collection = "messages")
public class ChatMessage {
    @MongoId
    String id;

    @Indexed
    String channelId; // ID of the channel this message belongs to

    @Indexed
    String groupId; // Optional group ID if the message is linked to a group chat

    String content;

    Participant sender;

    @Builder.Default
    MessageType messageType = MessageType.TEXT;

    String fileUrl; // URL for message type FILE or IMAGE

    @Indexed
    Instant createdDate;
    @Indexed
    Instant updatedDate;

    @Builder.Default
    boolean isActive = true; // Soft delete support
}
