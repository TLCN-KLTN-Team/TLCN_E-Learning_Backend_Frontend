package demo.app.chat_app.model.workspace;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.MongoId;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * TẦNG 2 — Section đại diện cho Lớp học
 *
 * Container tổ chức các Channel bên trong một Workspace.
 * Membership của lớp được quản lý qua SectionMember — không lưu
 * danh sách thành viên trực tiếp ở đây.
 *
 * Ví dụ (cùng Workspace "Trí tuệ nhân tạo - HK1 2024"):
 *   Section "Lớp TH-01 — Thứ 3, 7h30"   → 50 SV
 *   Section "Lớp TH-02 — Thứ 5, 13h00"  → 50 SV
 *   Section "Lớp TH-03 — Thứ 7, 8h00"   → 50 SV
 *
 * Quan hệ:
 *   Workspace   1 ──► n  Section
 *   Section     1 ──► n  Channel
 *   Section     1 ──► n  SectionMember
 *
 * "Danh sách SV của lớp này?"
 *   → db.section_members.find({ sectionId, role: "STUDENT", status: "ACTIVE" })
 *
 * "Số SV của lớp này?"
 *   → Section.studentCount  (cache, cập nhật $inc từ SectionMember)
 */

@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "sections")
@FieldDefaults(level = AccessLevel.PRIVATE)
@CompoundIndexes({
        @CompoundIndex(name = "workspace_sections_idx",
                def = "{'workspaceId': 1}"),
        @CompoundIndex(name = "workspace_code_unique",
                def = "{'workspaceId': 1, 'classId': 1}",
                unique = true)
})
public class Section {

    @MongoId
    String id;

    // ── Thuộc về Workspace nào ───────────────────────────────────

    String workspaceId; // Không bao giờ null

    Integer classId;
    /*
     * Đanh cho lớp học. VD: "TH-01"
     */

    // ── Thông tin lớp học ─────────────────────────────────────────
    String name;
    /*
     * Tên hiển thị. VD: "Lớp TH-01 — Thứ 3"
     * Không cần unique toàn hệ thống, chỉ unique trong
     * Workspace thông qua field code.
     */
    String description;
    String schedule; // "Thứ 3, 7h30 - 10h00"
    String room;         // "B4-301" hoặc "Online - Meet
    List<String> sectionMembers;
    /*
     * Danh sách thành viên để cho phép truy vấn nhanh "Ai thuộc lớp này?".
     * Để giúp thêm/xóa thành viên nhanh chóng mà không cần cập nhật SectionMember.
     */

    // ── Trạng thái ───────────────────────────────────────────────
    private SectionStatus status;
    /*
     * ACTIVE   → Đang học
     * FINISHED → Kết thúc học kỳ
     *            Tất cả Channel trong Section chuyển sang ARCHIVED
     * LOCKED   → Tạm khóa bởi TEACHER, SV không gửi tin được
     */

    int studentCount;
    /*
     * Số SV ACTIVE trong Section này.
     * Denormalized từ SectionMember — cập nhật $inc khi
     * thêm/xóa SectionMember có role=STUDENT.
     * KHÔNG đếm TEACHER và MODERATOR.
     *
     * Lý do để ở Section thay vì Channel:
     *   studentCount đại diện cho sĩ số chính thức của lớp,
     *   không phải số người trong một kênh chat cụ thể.
     *   Số người trong Channel → Channel.memberCount
     */

    @Builder.Default
    boolean isPublic = false; // Nếu true, SV có thể xem tin nhan.

    // ── Audit ────────────────────────────────────────────────────
    @CreatedDate
    private Instant createdAt;
    @LastModifiedDate  // Tự động update khi save
    private Instant updatedAt;

    public void addMember(String userId) {
        if (sectionMembers == null) {
            sectionMembers = new ArrayList<>();
        }

        if (!sectionMembers.contains(userId)) {
            sectionMembers.add(userId);
        }
    }

    public void removeMember(String userId) {
        if (sectionMembers != null) {
            sectionMembers.remove(userId);
        }
    }

    public void addMembers(List<String> userIds) {
        for (String userId : userIds) {
            addMember(userId);
        }
    }

}
