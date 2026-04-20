package demo.app.chat_app.model.workspace;

import demo.app.chat_app.model.enums.AttachmentType;
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
import java.util.ArrayList;
import java.util.List;

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
    String channelId; // ID of the channel this message belongs to

    @Indexed
    String groupId; // Optional group ID if the message is linked to a group chat

    String content;

    String sender;

    @Builder.Default
    MessageType messageType = MessageType.TEXT;

    @Builder.Default
    MessageStatus status = MessageStatus.PENDING;

    String fileUrl; // Legacy: URL for message type FILE or IMAGE

    // Embedded attachment references for the post-attach pattern
    @Builder.Default
    List<MessageAttachment> attachments = new ArrayList<>();

    // Legacy field kept for backward compatibility
    List<MessageAttachment> messageAttachments;

    @Indexed
    Instant createdDate;
    @Indexed
    Instant updatedDate;

    @Builder.Default
    boolean isActive = true; // Soft delete support
}
