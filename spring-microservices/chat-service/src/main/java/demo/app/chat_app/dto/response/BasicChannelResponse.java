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
public class BasicChannelResponse {
    String id;
    String participantHash;
    String channelName;
}
