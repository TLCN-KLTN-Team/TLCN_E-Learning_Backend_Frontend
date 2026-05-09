package demo.app.chat_app.dto.request;

import demo.app.chat_app.model.enums.AttachmentCategory;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AttachmentUploadRequest {
    String messageId;      // Message ID to attach the file to
    String channelId;      // Channel ID for validation
    String fileName;       // Original file name
    String contentType;    // File content type

    /**
     * UC-41: phân loại tài liệu trong channel GROUP.
     * Null/không truyền → mặc định GENERAL ở service layer.
     */
    AttachmentCategory category;
}
