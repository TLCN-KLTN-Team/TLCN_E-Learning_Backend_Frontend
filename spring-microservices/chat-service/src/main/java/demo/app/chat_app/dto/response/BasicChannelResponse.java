package demo.app.chat_app.dto.response;

import demo.app.chat_app.model.workspace.ChannelScope;
import demo.app.chat_app.model.workspace.ChannelStatus;
import demo.app.chat_app.model.workspace.ChannelType;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BasicChannelResponse {
    String id;
    String sectionId;
    String name;
    String slug;
    String description;
    ChannelScope scope;
    ChannelType type;
    ChannelStatus status;
    int memberCount;
}
