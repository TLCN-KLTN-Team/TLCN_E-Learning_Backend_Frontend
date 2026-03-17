package demo.app.chat_app.model.workspace;

import com.fasterxml.jackson.annotation.JsonValue;
import lombok.Getter;

/**
 * Rich enum cho trạng thái thành viên trong Channel/Section
 *
 * @code - Giá trị lưu trong database
 * @label - Giá trị hiển thị cho người dùng
 */
@Getter
public enum MemberStatus {
    ACTIVE("ACTIVE", "Đang hoạt động"),
    INVITED("INVITED", "Đã mời"),
    MUTED("MUTED", "Bị tắt tiếng"),
    BANNED("BANNED", "Bị cấm"),
    LEFT("LEFT", "Đã rời");

    @JsonValue
    private final String code;
    private final String label;

    MemberStatus(String code, String label) {
        this.code = code;
        this.label = label;
    }

    /**
     * Tìm MemberStatus từ code
     */
    public static MemberStatus fromCode(String code) {
        for (MemberStatus status : values()) {
            if (status.code.equals(code)) {
                return status;
            }
        }
        throw new IllegalArgumentException("Unknown MemberStatus code: " + code);
    }

    /**
     * Kiểm tra xem thành viên có thể tham gia không
     */
    public boolean canParticipate() {
        return this == ACTIVE;
    }

    /**
     * Kiểm tra xem thành viên có thể gửi tin nhắn không
     */
    public boolean canSendMessage() {
        return this == ACTIVE;
    }
}
