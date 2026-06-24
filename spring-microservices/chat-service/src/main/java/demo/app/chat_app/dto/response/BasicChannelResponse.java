package demo.app.chat_app.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import demo.app.chat_app.model.workspace.ChannelScope;
import demo.app.chat_app.model.workspace.ChannelStatus;
import demo.app.chat_app.model.workspace.ChannelType;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BasicChannelResponse {
    String id;
    String name;

    @JsonProperty("isPublic")
    boolean isPublic;

    ChannelType type;
    Instant submissionDeadline;
    Instant crossReviewDeadline;
    boolean allowCrossReview;
}
