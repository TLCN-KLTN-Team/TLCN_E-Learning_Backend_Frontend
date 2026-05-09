package demo.app.chat_app.model.enums;

import lombok.Getter;

/**
 * Phân loại tài liệu trong Channel GROUP để UC-41 tách "Tài liệu chung"
 * và "Bài đã nộp" ngay trên cùng một collection attachments.
 */
@Getter
public enum AttachmentCategory {
    GENERAL("GENERAL"),       // Tài liệu chung — chia sẻ trong nhóm
    SUBMISSION("SUBMISSION"); // Bài đã nộp — bài tập của nhóm

    private final String type;

    AttachmentCategory(String type) {
        this.type = type;
    }
}
