package demo.app.chat_app.model;

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

    String message;
    
    Participant sender;

    @Builder.Default
    MessageType messageType = MessageType.TEXT;

    List<Attachment> attachments; // List of attachments (images, files, etc.)

    @Indexed
    Instant createdDate;
    
    @Indexed
    Instant updatedDate;
    
    // Message status fields
    boolean edited;
    boolean deleted;
    String parentMessageId; // For reply functionality
    
    // Message reactions/interactions
    List<String> reactions; // User IDs who reacted
}
