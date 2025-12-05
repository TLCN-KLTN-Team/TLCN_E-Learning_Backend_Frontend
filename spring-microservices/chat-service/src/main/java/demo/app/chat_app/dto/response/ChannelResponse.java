package demo.app.chat_app.dto.response;

import demo.app.chat_app.model.Participant;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ChannelResponse {
    String id;
    String participantHash;
    String channelName;
    String description;
    List<Participant> participants;
    List<ChatMessageResponse> messages;
    int durationMinutes;
    boolean isPrivate;
    Instant createdAt;
    boolean ended;
}
