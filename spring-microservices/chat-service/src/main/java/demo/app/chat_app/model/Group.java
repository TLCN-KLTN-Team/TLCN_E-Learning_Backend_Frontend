package demo.app.chat_app.model;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.MongoId;

import java.time.Instant;
import java.util.List;

@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "groups")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Group {
    @MongoId
    String id;
    String groupName;
    String description;

    String channelId;

    List<Participant> members;

    @CreatedDate @Indexed
    Instant createdAt;
    Instant deletedAt;

    @Builder.Default
    boolean deleted=false;

}
