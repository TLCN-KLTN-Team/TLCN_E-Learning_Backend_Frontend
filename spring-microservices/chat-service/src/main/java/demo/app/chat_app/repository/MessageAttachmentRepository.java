package demo.app.chat_app.repository;

import demo.app.chat_app.model.enums.AttachmentCategory;
import demo.app.chat_app.model.workspace.MessageAttachment;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageAttachmentRepository extends MongoRepository<MessageAttachment, String> {
    List<MessageAttachment> findMessageAttachmentByActiveOrderByUploadedAtDesc(boolean active);

    List<MessageAttachment> findByMessageId(String messageId);

    List<MessageAttachment> findByChannelId(String channelId);

    /**
     * UC-41: list attachments theo channel + category, chỉ những file còn active.
     * Dùng cho panel "Tài liệu chung" / "Bài đã nộp" / "Bài cần chấm chéo".
     */
    List<MessageAttachment> findByChannelIdAndCategoryAndIsActiveTrueOrderByUploadedAtDesc(
            String channelId, AttachmentCategory category);
}
