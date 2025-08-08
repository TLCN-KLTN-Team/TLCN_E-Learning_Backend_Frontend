package demo.app.chat_app.dto.request;

import demo.app.chat_app.model.Participant;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ChannelCreationRequest {
    String workspaceId;
    String name;
    String description;
    List<Participant> members;
}
