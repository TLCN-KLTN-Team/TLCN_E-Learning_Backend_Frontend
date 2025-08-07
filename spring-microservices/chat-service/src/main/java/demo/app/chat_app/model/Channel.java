package demo.app.chat_app.model;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.MongoId;

import java.time.Instant;
import java.util.List;

@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "channels")
@FieldDefaults(level = AccessLevel.PRIVATE)
// Compound index for efficient workspace + channel queries
@CompoundIndex(def = "{'workspaceId': 1, 'channelName': 1}", unique = true)
@CompoundIndex(def = "{'workspaceId': 1, 'createdAt': -1}")
public class Channel {
    @MongoId
    String id;

    @Indexed(sparse = true)
    String participantHash; // Unique hash for participants in the channel, e.g., "u1_u2"

    @Indexed
    String channelName;
    
    String description; // Description of the channel
    
    @Indexed
    String workspaceId; // ID of the workspace this channel belongs to
    
    // Remove embedded messages - store separately for better performance
    // List<ChatMessage> messages;
    
    List<Participant> participants; // List of participants in the channel

    @CreatedDate
    @Indexed
    Instant createdAt;

    // Helper methods for participants management
    public void addParticipant(Participant participant) {
        if (this.participants == null) {
            this.participants = new java.util.ArrayList<>();
        }
        if (!this.participants.contains(participant)) {
            this.participants.add(participant);
        }
    }

    public void removeParticipant(String userId) {
        if (this.participants != null) {
            this.participants.removeIf(p -> p.getUserId().equals(userId));
        }
    }

    public boolean hasParticipant(String userId) {
        return this.participants != null && 
               this.participants.stream().anyMatch(p -> p.getUserId().equals(userId));
    }
}
