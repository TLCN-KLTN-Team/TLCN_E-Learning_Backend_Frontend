package demo.app.chat_app.dto.response;

import demo.app.chat_app.model.enums.MessageStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AttachmentUploadResponse {
    boolean success;
    String message; // success or error message
    String messageId;
    String fileUrl;
}
