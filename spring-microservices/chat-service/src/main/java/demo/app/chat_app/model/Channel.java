package demo.app.chat_app.model;

import demo.app.chat_app.model.enums.ChannelStatus;
import demo.app.chat_app.utils.ChannelType;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.annotation.CreatedDate;
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
    String sectionId; // Section the channel belongs to
    String classId; // Class the channel is associated with
    
    List<String> memberIds; // List of participants in the channel (aka group for team chat)

    boolean isPrivate;
    boolean isGeneral; // General channel in the workspace

    @Builder.Default
    ChannelType type = ChannelType.TEXT;

    @Builder.Default
    ChannelStatus status= ChannelStatus.ACTIVE;

    int durationMinutes;

    @CreatedDate
    @Indexed
    Instant createdAt;

    Instant deletedAt; // Timestamp when the channel was ended, change status to ENDED

    public void addMember(String memberId) {
        if (memberIds == null) {
            memberIds = new ArrayList<>();
        }
        if (!memberIds.contains(memberId)) {
            memberIds.add(memberId);
        }
    }

    public void addMembers(List<String> memberIds) {
        if (this.memberIds == null) {
            this.memberIds = new ArrayList<>();
        }
        boolean added = false;
        for (String memberId : memberIds) {
            if (!this.memberIds.contains(memberId)) {
                this.memberIds.add(memberId);
            }
        }
    }

    public void removeMember(String memberId) {
        if (memberIds != null) {
            memberIds.remove(memberId);
        }
    }

    public boolean hasMember(String memberId) {
        return memberIds != null && memberIds.contains(memberId);
    }

}
