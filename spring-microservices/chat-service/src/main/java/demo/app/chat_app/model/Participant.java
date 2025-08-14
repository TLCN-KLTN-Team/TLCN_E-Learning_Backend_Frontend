package demo.app.chat_app.model;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.mongodb.core.mapping.Field;

@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Participant {
    String userId;
    String firstName;
    String lastName;
    String mssv;
    String avatarUrl; // URL to the user's avatar image
}
