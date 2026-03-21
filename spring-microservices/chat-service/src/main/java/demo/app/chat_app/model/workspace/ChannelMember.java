package demo.app.chat_app.model.workspace;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.MongoId;

import java.time.Instant;

/**
 * ChannelMember — Thành viên của một Channel cụ thể (INDEPENDENT COLLECTION).
 *
 * Là tập con của SectionMember — chỉ những ai có trong
 * SectionMember mới được là ChannelMember.
 *
 * Mục đích chính: hiển thị nhanh danh sách thành viên
 * trên UI channel mà không cần query ngược lên SectionMember.
 *
 * ════════════════════════════════════════════════════════════════
 *  QUAN HỆ VỚI SECTIONMEMBER
 * ════════════════════════════════════════════════════════════════
 *
 *  SectionMember = danh sách chính thức của LỚP
 *  ChannelMember = danh sách thành viên của KÊNH CỤ THỂ
 *
 *  Ràng buộc cứng (enforce ở Service):
 *    Trước khi tạo ChannelMember:
 *      db.section_members.findOne({
 *        sectionId: channel.sectionId,
 *        userId:    userId,
 *        status:    "ACTIVE"
 *      }) != null
 *    Nếu null → throw NotSectionMemberException
 *
 *  Cascade khi SectionMember bị BANNED:
 *    → Service tìm và BANNED toàn bộ ChannelMember
 *      của userId đó trong cùng sectionId
 *
 * ════════════════════════════════════════════════════════════════
 *  CÁC LOẠI CHANNEL VÀ CHANNELMEMBER TƯƠNG ỨNG
 * ════════════════════════════════════════════════════════════════
 *
 *  Channel scope=MAIN (kênh chung cả lớp):
 *    → ChannelMember = toàn bộ SectionMember ACTIVE
 *    → Tạo tự động khi TEACHER tạo MAIN channel
 *    → Hoặc TEACHER có thể tạo thủ công
 *
 *  Channel scope=GROUP (kênh nhóm nhỏ):
 *    → ChannelMember = tập con TEACHER chọn từ SectionMember
 *    → UI hiển thị danh sách SectionMember để TEACHER tick chọn
 *    → 1 SV có thể thuộc nhiều GROUP trong cùng Section
 *
 * ════════════════════════════════════════════════════════════════
 *  INDEX
 * ════════════════════════════════════════════════════════════════
 *
 *  (channelId, userId) UNIQUE — một user chỉ có 1 record trong 1 channel
 *  (sectionId, userId)        — cascade BANNED từ SectionMember
 *  (userId)                   — lấy tất cả channels của user
 *  (channelId, status)        — lấy tất cả active members của channel
 * ════════════════════════════════════════════════════════════════
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "channel_members")
@FieldDefaults(level = AccessLevel.PRIVATE)
@CompoundIndexes({
        @CompoundIndex(name = "channel_user_unique", def = "{'channelId': 1, 'userId': 1}", unique = true),
        @CompoundIndex(name = "section_user_idx", def = "{'sectionId': 1, 'userId': 1}"),
        @CompoundIndex(name = "user_idx", def = "{'userId': 1}"),
        @CompoundIndex(name = "channel_status_idx", def = "{'channelId': 1, 'status': 1}")
})
public class ChannelMember {

    @MongoId
    String id;

    // ── Khóa xác định ────────────────────────────────────────────
    private String channelId;
    /*
     * Channel mà record này thuộc về. Không bao giờ null.
     */

    private String sectionId;
    /*
     * Denormalized từ Channel.sectionId.
     * Phục vụ index (sectionId, userId) để cascade BANNED
     * từ SectionMember xuống ChannelMember mà không cần
     * JOIN qua Channel.
     */

    private String userId;
    /*
     * Phải tồn tại trong SectionMember với:
     *   sectionId = this.sectionId, status = ACTIVE
     */

    // ── Vai trò ──────────────────────────────────────────────────
    private ChannelRole role;
    /*
     * Kế thừa từ SectionMember.role khi tạo tự động.
     * TEACHER có thể chỉ định MODERATOR cho channel cụ thể
     * (VD: nhóm trưởng của nhóm nhỏ).
     *
     * TEACHER    → Quyền quản lý channel
     * MODERATOR  → Quyền pin, xóa message của STUDENT
     * STUDENT    → Quyền đọc và gửi message
     */

    // ── Trạng thái ───────────────────────────────────────────────
    @Builder.Default
    private MemberStatus status = MemberStatus.ACTIVE;
    /*
     * ACTIVE  → Bình thường
     * MUTED   → Bị tắt tiếng, chỉ xem không gửi được
     *           (áp dụng riêng cho user này, khác Channel.isReadOnly)
     * BANNED  → Bị đuổi khỏi channel
     *           Có thể do cascade từ SectionMember hoặc
     *           TEACHER kick trực tiếp khỏi channel này
     */

    // ── Thông tin hiển thị (mục đích chính của entity này) ───────
    private String nickname;

    private String avatarUrl;
    /*
     * Snapshot avatar tại thời điểm join.
     * Tương tự displayName — phục vụ render nhanh.
     * Cập nhật khi User đổi avatar.
     */

    // ── Tracking đã đọc ──────────────────────────────────────────
    private String lastReadMessageId;
    /*
     * ID tin nhắn cuối cùng user đã đọc.
     * Dùng để tính badge "tin nhắn chưa đọc" trên sidebar.
     * Cập nhật khi user focus vào channel hoặc scroll đến cuối.
     */

    private int unreadCount;
    /*
     * Số tin nhắn chưa đọc.
     * Tăng $inc khi có Message mới trong channel này.
     * Reset về 0 khi user đọc đến lastReadMessageId.
     */

    private int unreadMentionCount;
    /*
     * Số lần bị @mention chưa đọc.
     * Tăng khi Message.mentionedUserIds chứa userId này.
     */

    // ── Thông báo ────────────────────────────────────────────────
    private NotificationLevel notificationLevel;
    /*
     * ALL      → Thông báo mọi tin nhắn (mặc định)
     * MENTIONS → Chỉ khi bị @mention
     * MUTED    → Tắt hoàn toàn
     */

    // ── Audit ────────────────────────────────────────────────────
    private String  addedByUserId; // TEACHER nào thêm vào channel này
    private Instant joinedAt;
    private Instant updatedAt;
}
