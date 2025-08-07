package demo.app.chat_app.model;

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
public class Attachment {
    @MongoId
    String id; // Unique identifier for the attachment

    @Indexed
    String channelId; // ID of the channel this attachment belongs to

    @Indexed
    String messageId; // ID of the message this attachment belongs to

    String fileName; // Name of the file being attached

    String fileType; // Type of the file (e.g., image/png, application/pdf)

    long fileSize; // Size of the file in bytes

    String url; // URL where the attachment is stored (e.g., in a cloud storage service)

    @Indexed
    String uploadedBy; // ID of the user who uploaded the attachment

    @Indexed
    Instant uploadedAt; // Timestamp when the attachment was uploaded
    
    // Additional metadata
    String thumbnail; // URL to thumbnail for images/videos
    String originalFileName; // Original filename before processing
    String mimeType; // MIME type
    
    @Builder.Default
    boolean isActive = true; // Soft delete support
}
