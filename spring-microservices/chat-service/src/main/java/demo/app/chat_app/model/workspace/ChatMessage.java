package demo.app.chat_app.model.workspace;

import demo.app.chat_app.model.enums.MessageStatus;
import demo.app.chat_app.model.enums.MessageType;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.MongoId;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@CompoundIndexes({
        @CompoundIndex(name = "channel_created_idx",        def = "{'channelId': 1, 'createdDate': -1}"),
        @CompoundIndex(name = "channel_sender_created_idx", def = "{'channelId': 1, 'sender': 1, 'createdDate': -1}")
})
@Document(collection = "messages")
public class ChatMessage {
    @MongoId
    String id;

    @Indexed(unique = true, sparse = true)
    String clientMessageId; // UUID from frontend, used as merge key for post-attach pattern

    @Indexed
    String channelId;

    @Indexed
    String groupId;

    String content;

    String sender;

    @Builder.Default
    MessageType messageType = MessageType.TEXT;

    @Builder.Default
    MessageStatus status = MessageStatus.PENDING;

    // Attachments are stored in the dedicated `attachments` collection
    // (MessageAttachment) and queried by messageId at response time.
    // Source of truth lives there — no embedding here.

    @Indexed
    Instant createdDate;
    @Indexed
    Instant updatedDate;

    @Builder.Default
    boolean isActive = true; // Soft delete support
}
