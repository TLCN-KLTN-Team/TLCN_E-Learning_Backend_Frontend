package demo.app.chat_app.dto.request;

import demo.app.chat_app.model.forum.VoteTargetType;
import demo.app.chat_app.model.forum.VoteType;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VoteRequest {
    String targetId;
    VoteTargetType targetType;
    VoteType type;
}
