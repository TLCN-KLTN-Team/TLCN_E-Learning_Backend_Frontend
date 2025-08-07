package demo.app.chat_app.dto.response;

import demo.app.chat_app.model.Participant;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

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
    List<ChannelResponse> channels;
    List<Participant> members;
}
