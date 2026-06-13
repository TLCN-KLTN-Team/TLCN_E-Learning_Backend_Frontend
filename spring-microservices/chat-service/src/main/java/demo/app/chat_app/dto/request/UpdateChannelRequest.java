package demo.app.chat_app.dto.request;

import demo.app.chat_app.model.workspace.ChannelStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.AccessLevel;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UpdateChannelRequest {
    String name;
    String description;
    ChannelStatus status;
    Boolean isReadOnly;
    Boolean isPublic;
}
