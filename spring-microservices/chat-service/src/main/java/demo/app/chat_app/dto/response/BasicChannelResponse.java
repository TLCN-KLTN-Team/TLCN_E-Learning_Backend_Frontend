package demo.app.chat_app.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BasicChannelResponse {
    String id;
    String participantHash;
    String channelName;
    String description;
    long endTime;
    boolean ended;
}
