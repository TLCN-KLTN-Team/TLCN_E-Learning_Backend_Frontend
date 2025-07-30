package demo.app.chat_app.model;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.MongoId;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Builder
@Document(collection = "conversations")
public class Conversation {
    @MongoId
    String id;

    String type; // GROUP, DIRECT

    @Indexed(unique = true)
    @Field("participants_hash")
    String participantsHash; // u1_u2,

    @Field("participant_infos")
    List<ParticipantInfo> participants; //embedded documents

    @Field("created_at")
    Instant createdAt;
    @Field("modified_at")
    Instant modifiedAt;

    List<ChatMessage> messages; //embedded documents, not indexed, can be large

    public void addMessage(ChatMessage message) {
        if (messages == null) {
            messages = new ArrayList<>();
        }
        messages.add(message);
    }

    public void removeMessage(ChatMessage message) {
        if (messages != null) {
            messages.remove(message);
        }
    }
}
