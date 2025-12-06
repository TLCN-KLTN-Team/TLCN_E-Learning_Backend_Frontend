package demo.app.chat_app.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ChannelCreationRequest {
    String sectionId;
    String workspaceId;
    String channelType;
    String channelName;
    String description;
    List<String> memberIds;
    int durationInMinutes;
    boolean isPrivate;
    long endTime;
}
