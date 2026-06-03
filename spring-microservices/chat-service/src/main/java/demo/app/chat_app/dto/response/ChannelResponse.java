package demo.app.chat_app.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import demo.app.chat_app.model.workspace.ChannelScope;
import demo.app.chat_app.model.workspace.ChannelStatus;
import demo.app.chat_app.model.workspace.ChannelType;
import demo.app.chat_app.service.util.ChannelPhase;
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
    String sectionId;
    String name;
    String slug;
    String description;
    int position;
    ChannelScope scope;
    ChannelType type;
    ChannelStatus status;
    @JsonProperty("isReadOnly")
    boolean isReadOnly;
    @JsonProperty("isPublic")
    boolean isPublic;
    int memberCount;
    String lastMessageId;
    Instant lastActivityAt;
    List<ChatMessageResponse> messages;
    Instant createdAt;

    // ── UC-41 ────────────────────────────────────────────────────
    String assignmentSessionId;
    Instant submissionDeadline;
    Instant crossReviewDeadline;
    boolean allowCrossReview;
    Instant submissionClosedAt;
    Instant expiresAt;
    /**
     * Pha runtime — derive từ deadlines + now. Frontend dùng để
     * disable input/upload khi phase != OPEN.
     */
    ChannelPhase phase;
}
