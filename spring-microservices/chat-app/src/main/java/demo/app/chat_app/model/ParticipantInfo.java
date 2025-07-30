package demo.app.chat_app.model;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ParticipantInfo {
    String userId;
    String username;
    @Field("first_name")
    String firstName;
    @Field("last_name")
    String lastName;
    @Field("avatar_url")
    String avatarUrl; // URL to the user's avatar image
}
