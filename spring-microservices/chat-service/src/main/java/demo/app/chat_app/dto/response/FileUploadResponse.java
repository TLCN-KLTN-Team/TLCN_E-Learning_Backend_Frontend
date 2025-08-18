package demo.app.chat_app.dto.response;

import demo.app.chat_app.model.MessageAttachment;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class FileUploadResponse {
    boolean success;
    String message;
    MessageAttachment attachment;
    String temporaryMessageId; // Used for temporary storage before final upload
}
