package demo.app.chat_app.model.workspace;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.MongoId;

import java.time.Instant;

/**
 * TẦNG 3 — Channel (Kênh chat)
 *
 * Kênh giao tiếp bên trong một Section.
 * Membership của channel quản lý qua ChannelMember.
 *
 * ════════════════════════════════════════════════════════════════
 *  PHÂN LOẠI CHANNEL
 * ════════════════════════════════════════════════════════════════
 *
 *  Theo scope (tổ chức):
 *  ┌─────────┬──────────────────────────────────────────────────┐
 *  │ MAIN    │ Kênh chính của lớp                               │
 *  │         │ • Mỗi Section chỉ có đúng 1 MAIN                 │
 *  │         │ • ChannelMember = toàn bộ SectionMember          │
 *  │         │ • maxMembers = sĩ số lớp (VD: 50)                │
 *  │         │ • parentChannelId = null                         │
 *  ├─────────┼──────────────────────────────────────────────────┤
 *  │ GROUP   │ Kênh nhóm nhỏ trong lớp                          │
 *  │         │ • Nhiều GROUP / Section                          │
 *  │         │ • ChannelMember ⊆ SectionMember của Section này  │
 *  │         │ • parentChannelId → MAIN channel của Section     │
 *  │         │ • maxMembers = giới hạn nhóm (VD: 10)            │
 *  └─────────┴──────────────────────────────────────────────────┘
 *
 *  Theo type (chức năng):
 *  ┌─────────┬──────────────────────────────────────────────────┐
 *  │ TEXT    │ Chat văn bản — có Message                        │
 *  ├─────────┼──────────────────────────────────────────────────┤
 *  │ VOICE   │ Họp trực tuyến WebRTC — KHÔNG có Message         │
 *  │         │ Trạng thái ai đang trong phòng → Redis (TTL)     │
 *  └─────────┴──────────────────────────────────────────────────┘
 *
 *  Hai chiều độc lập → kết hợp tự do:
 *    MAIN/TEXT, MAIN/VOICE, GROUP/TEXT, GROUP/VOICE
 *
 * ════════════════════════════════════════════════════════════════
 *  RÀNG BUỘC KHI TẠO CHANNEL
 * ════════════════════════════════════════════════════════════════
 *
 *  Tạo MAIN channel:
 *    1. createdByUserId phải là SectionMember với role=TEACHER
 *    2. Chưa tồn tại MAIN channel trong Section này:
 *         db.channels.findOne({ sectionId, scope: "MAIN" }) == null
 *       Nếu đã có → throw DuplicateMainChannelException
 *    3. Tự động tạo ChannelMember cho toàn bộ SectionMember ACTIVE
 *
 *  Tạo GROUP channel:
 *    1. createdByUserId phải là SectionMember với role=TEACHER
 *    2. parentChannelId != null
 *         && channels[parentChannelId].sectionId == this.sectionId
 *         && channels[parentChannelId].scope == MAIN
 *    3. TEACHER chọn thủ công thành viên từ SectionMember
 *       → Tạo ChannelMember cho từng người được chọn
 *
 * ════════════════════════════════════════════════════════════════
 *  INDEX
 * ════════════════════════════════════════════════════════════════
 *
 *  (sectionId)              — lấy tất cả channel của 1 section
 *  (sectionId, slug) UNIQUE — slug không trùng trong section
 *  (parentChannelId)        — lấy tất cả GROUP của 1 MAIN channel
 */

@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "channels")
@FieldDefaults(level = AccessLevel.PRIVATE)
@CompoundIndexes({
        @CompoundIndex(name = "section_slug_unique",  def = "{'sectionId': 1, 'slug': 1}",       unique = true),
        @CompoundIndex(name = "section_created_idx",  def = "{'sectionId': 1, 'createdAt': -1}")
})
public class Channel {
    @MongoId
    String id;

    // ── Phân cấp ─────────────────────────────────────────────────
    private String sectionId;
    /*
     * Section chứa Channel này. Không bao giờ null.
     * Không denormalize workspaceId vào đây vì Channel
     * không cần query ngược lên Workspace trực tiếp.
     * Nếu cần workspaceId → lấy qua Section.
     */

    private ChannelScope scope;
    /*
     * MAIN  → Kênh chính của Section — đúng 1 cái
     * GROUP → Kênh nhóm nhỏ — nhiều cái
     */

    // ── Thông tin Channel ─────────────────────────────────────────
    private String name;        // "Chung", "Nhóm A", "Thảo luận"
    private String slug;        // "chung", "nhom-a", "thao-luan"
    private String description;
    private int position;    // Thứ tự hiển thị trong Section

    private ChannelType type;
    /*
     * TEXT  → Chat văn bản, có Message
     * VOICE → Họp trực tuyến, không có Message
     */

    // ── Cài đặt TEXT channel ─────────────────────────────────────
    @Builder.Default
    private boolean isReadOnly = false;
    /*
     * true  → Chỉ TEACHER/MODERATOR gửi tin được
     * false → Tất cả ChannelMember đều gửi được (mặc định)
     */
    @Builder.Default
    private boolean isPublic = false;

    // ── Trạng thái ───────────────────────────────────────────────
    private ChannelStatus status;
    /*
     * ACTIVE   → Bình thường
     * LOCKED   → Tạm khóa, không ai gửi tin được
     * ARCHIVED → Lưu trữ, chỉ đọc lịch sử
     *            Tự động khi Section.status → FINISHED
     */

    // ── Cache (TEXT channel) ──────────────────────────────────────
    private String  lastMessageId;
    private Instant lastActivityAt;
    private int memberCount;
    /*
     * Số ChannelMember ACTIVE hiện tại.
     * Cập nhật $inc khi add/remove ChannelMember.
     * Dùng để hiển thị "X thành viên" trên UI
     * mà không cần COUNT query.
     */

    // ── Audit ────────────────────────────────────────────────────
    private String  createdByUserId; // TEACHER tạo channel
    private Instant createdAt;
    private Instant updatedAt;
}
