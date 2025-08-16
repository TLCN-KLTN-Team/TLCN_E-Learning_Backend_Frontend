package demo.app.chat_app.dto.response;

import demo.app.chat_app.model.enums.AttachmentType;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AttachmentResponse {
    String id;
    String fileName;
    String contentType; // MIME type of the file, e.g., "image/png", "application/pdf"
    long fileSize;
    AttachmentType attachmentType;
    String fileUrl;
    String thumbnail; // For images or videos, a thumbnail URL
    Instant uploadedAt;
}
