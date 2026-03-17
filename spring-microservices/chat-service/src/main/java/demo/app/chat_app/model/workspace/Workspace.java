package demo.app.chat_app.model.workspace;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.MongoId;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * TẦNG 1 — Workspace đại diện cho Khóa học
 *
 * Chỉ là container tổ chức các Section.
 * KHÔNG có membership — không cần WorkspaceMember.
 *
 * "Ai thuộc Workspace này?" → không phải câu hỏi cần trả lời
 * ở tầng này. Membership bắt đầu từ Section trở xuống.
 *
 * Workspace được tạo khi khóa học được khởi tạo trong hệ thống, và giao cho giảng viên quản lý.
 */

@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "workspaces")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Workspace {

    @MongoId
    String id;
    
    String name;
    String description;
    String avatarUrl; // URL to the workspace avatar image

    @Indexed
    Integer courseId; // ID of the course associated with the workspace
    
    @Indexed
    String ownerId; // ID of the instructor managing the workspace. Regularly a teacher

    // ── Trạng thái ───────────────────────────────────────────────
    private WorkspaceStatus status;
    /*
     * ACTIVE   → Đang hoạt động
     * ARCHIVED → Kết thúc, toàn bộ Section/Channel chỉ đọc
     */

    // ── Audit ────────────────────────────────────────────────────
    @Indexed
    @CreatedDate
    Instant createdAt;

    @LastModifiedDate  // Tự động update khi save
    Instant updatedAt;
    Instant endedAt; // Timestamp help change workspace status to ARCHIVED when course ends

}
