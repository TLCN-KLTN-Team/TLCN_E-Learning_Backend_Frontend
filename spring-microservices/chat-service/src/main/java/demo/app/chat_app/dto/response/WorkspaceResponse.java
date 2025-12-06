package demo.app.chat_app.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class WorkspaceResponse {
    String id;
    String name;
    String description;
    String avatarUrl;
}
