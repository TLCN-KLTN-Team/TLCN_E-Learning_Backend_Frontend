package demo.app.chat_app.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BulkRandomChannelResponse {

    /** ID của AssignmentSession vừa được tạo cho batch này. */
    String assignmentSessionId;

    List<BasicChannelResponse> channels;
}
