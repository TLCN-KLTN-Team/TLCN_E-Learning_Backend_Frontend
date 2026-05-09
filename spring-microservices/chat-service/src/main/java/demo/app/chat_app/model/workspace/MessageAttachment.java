package demo.app.chat_app.model.workspace;

import demo.app.chat_app.model.enums.AttachmentCategory;
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

    String messageId;

    @Indexed
    String channelId; // Channel this attachment belongs to

    String fileName; // Name of the file being attached

    String contentType; // Type of the file (e.g., image/png, application/pdf)

    long fileSize; // Size of the file in bytes

    String fileUrl; // where store file, I will use cloudinary.

    AttachmentType attachmentType;

    @Builder.Default
    AttachmentCategory category = AttachmentCategory.GENERAL;
    /*
     * UC-41: phân loại tài liệu trong channel GROUP.
     * GENERAL    → kho tài liệu chung của nhóm
     * SUBMISSION → bài nộp cuối cùng của nhóm
     * "Bài cần chấm chéo" của nhóm khác = SUBMISSION attachments của
     * channel mà reviewTargetChannelId trỏ tới — không lưu category riêng.
     */

    // for image/video
    String thumbnail;

    @Indexed
    Instant uploadedAt; // Timestamp when the attachment was uploaded
    
    @Builder.Default
    boolean isActive = true; // Soft delete support
}
