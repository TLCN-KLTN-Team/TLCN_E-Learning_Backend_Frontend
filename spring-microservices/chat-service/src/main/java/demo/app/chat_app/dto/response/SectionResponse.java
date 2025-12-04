package demo.app.chat_app.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SectionResponse {
    String id;
    String title;
    boolean isPublic;
    List<Channel> channels;

    @Builder
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Channel {
        String id;
        String channelName;
    }
}
