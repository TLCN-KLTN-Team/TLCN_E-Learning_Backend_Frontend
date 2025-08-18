package demo.app.chat_app.model;

import demo.app.chat_app.model.enums.AttachmentType;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.MongoId;

import java.time.Instant;

@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "attachments")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class MessageAttachment {
    @MongoId
    String id; // Unique identifier for the attachment

    String fileName; // Name of the file being attached

    String contentType; // Type of the file (e.g., image/png, application/pdf)

    long fileSize; // Size of the file in bytes

    String fileUrl; // where store file, I will use cloudinary.

    AttachmentType attachmentType;

    // for image/video
    String thumbnail;

    @Indexed
    Instant uploadedAt; // Timestamp when the attachment was uploaded
    
    @Builder.Default
    boolean isActive = true; // Soft delete support
}
