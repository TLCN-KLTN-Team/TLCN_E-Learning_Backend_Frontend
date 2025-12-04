package demo.app.chat_app.model;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "sections")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Section {
    String id;
    String title;

    @Indexed
    String workspaceId;

    @Builder.Default
    List<String> channelIds = new ArrayList<>();

    boolean isPublic;

    @Indexed @Builder.Default
    Instant createdAt = Instant.now();

    public void addChannelId(String channelId) {
        this.channelIds.add(channelId);
    }

    public void removeChannelId(String channelId) {
        this.channelIds.remove(channelId);
    }
}
