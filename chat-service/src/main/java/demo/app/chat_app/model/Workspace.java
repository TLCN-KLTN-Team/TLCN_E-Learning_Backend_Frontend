package demo.app.chat_app.model;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.MongoId;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "workspaces")
@FieldDefaults(level = AccessLevel.PRIVATE)
// Compound indexes for efficient queries
@CompoundIndex(def = "{'ownerId': 1, 'createdAt': -1}")
@CompoundIndex(def = "{'courseId': 1, 'isActive': 1}")
@CompoundIndex(def = "{'members.userId': 1, 'isActive': 1}")
public class Workspace {
    @MongoId
    String id;
    
    @Indexed
    String name;
    
    String description;
    String avatarUrl; // URL to the workspace avatar image
    
    @Indexed
    String ownerId; // ID of the instructor managing the workspace
    
    @Indexed
    String courseId; // ID of the course associated with the workspace

    List<Participant> members; // List of participants in the workspace

    // Store only channel references, not embedded documents
    List<String> channelIds; // List of channel IDs in the workspace

    @Indexed
    Instant createdAt;
    
    Instant updatedAt;
    
    @Builder.Default
    @Indexed
    boolean isActive = true; // Soft delete support

    public void addChannel(String channelId) {
        if (this.channelIds == null) {
            this.channelIds = new ArrayList<>();
        }
        if (!this.channelIds.contains(channelId)) {
            this.channelIds.add(channelId);
        }
    }
    
    public void removeChannel(String channelId) {
        if (this.channelIds != null) {
            this.channelIds.remove(channelId);
        }
    }
    
    public void addMember(Participant member) {
        if (this.members == null) {
            this.members = new ArrayList<>();
        }
        if (!this.members.contains(member)) {
            this.members.add(member);
        }
    }
    
    public void removeMember(String userId) {
        if (this.members != null) {
            this.members.removeIf(m -> m.getUserId().equals(userId));
        }
    }
    
    public boolean hasMember(String userId) {
        return this.members != null && 
               this.members.stream().anyMatch(m -> m.getUserId().equals(userId));
    }
}
