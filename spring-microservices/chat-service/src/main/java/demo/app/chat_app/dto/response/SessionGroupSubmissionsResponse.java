package demo.app.chat_app.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

/**
 * UC-41: bài nộp của một nhóm trong session, dùng cho panel chấm chéo.
 * Mỗi phần tử trong List trả về của endpoint cross-review-attachments là một nhóm.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SessionGroupSubmissionsResponse {
    String channelId;
    String channelName;
    List<AttachmentResponse> files;
}
