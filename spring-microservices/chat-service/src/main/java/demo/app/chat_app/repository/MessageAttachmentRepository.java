package demo.app.chat_app.repository;

import demo.app.chat_app.model.enums.AttachmentCategory;
import demo.app.chat_app.model.enums.AttachmentType;
import demo.app.chat_app.model.workspace.MessageAttachment;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface MessageAttachmentRepository extends MongoRepository<MessageAttachment, String> {
    List<MessageAttachment> findMessageAttachmentByActiveOrderByUploadedAtDesc(boolean active);

    List<MessageAttachment> findByMessageId(String messageId);

    List<MessageAttachment> findByMessageIdInAndIsActiveTrue(Collection<String> messageIds);

    List<MessageAttachment> findByChannelId(String channelId);

    /**
     * UC-41: list attachments thuộc tập messageIds và channelId, active only, mới nhất trước.
     * Dùng cho panel "Bài đã nộp" — lấy từ session.submittedFileMessageIds + lọc theo channel.
     */
    List<MessageAttachment> findByMessageIdInAndChannelIdAndIsActiveTrueOrderByUploadedAtDesc(
            Collection<String> messageIds, String channelId);

    /**
     * UC-41: list attachments theo channel + category, chỉ những file còn active.
     * Dùng cho panel "Tài liệu chung" / "Bài đã nộp" / "Bài cần chấm chéo".
     */
    List<MessageAttachment> findByChannelIdAndCategoryAndIsActiveTrueOrderByUploadedAtDesc(
            String channelId, AttachmentCategory category);

    /**
     * List attachments của channel có attachmentType chỉ định (active only),
     * mới nhất trước. Dùng cho gallery "Ảnh đã gửi".
     */
    List<MessageAttachment> findByChannelIdAndAttachmentTypeAndIsActiveTrueOrderByUploadedAtDesc(
            String channelId, AttachmentType attachmentType);

    /**
     * List attachments của channel với attachmentType nằm trong tập hợp truyền vào,
     * active only, mới nhất trước. Dùng cho list "File đã gửi" (mọi loại trừ IMAGE).
     */
    List<MessageAttachment> findByChannelIdAndAttachmentTypeInAndIsActiveTrueOrderByUploadedAtDesc(
            String channelId, Collection<AttachmentType> attachmentTypes);
}
