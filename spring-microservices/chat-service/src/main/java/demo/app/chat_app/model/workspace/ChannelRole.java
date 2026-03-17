package demo.app.chat_app.model.workspace;

import com.fasterxml.jackson.annotation.JsonValue;
import lombok.Getter;

/**
 * Rich enum cho vai trò của thành viên trong Channel
 *
 * @code - Giá trị lưu trong database
 * @label - Giá trị hiển thị cho người dùng
 */
@Getter
public enum ChannelRole {
    OWNER("OWNER", "Chủ sở hữu"),
    TEACHER("TEACHER", "Giảng viên"),
    MODERATOR("MODERATOR", "Điều hành viên"),
    STUDENT("STUDENT", "Học viên");

    @JsonValue
    private final String code;
    private final String label;

    ChannelRole(String code, String label) {
        this.code = code;
        this.label = label;
    }

    /**
     * Tìm ChannelRole từ code
     */
    public static ChannelRole fromCode(String code) {
        for (ChannelRole role : values()) {
            if (role.code.equals(code)) {
                return role;
            }
        }
        throw new IllegalArgumentException("Unknown ChannelRole code: " + code);
    }

    /**
     * Kiểm tra xem role có quyền quản lý không
     */
    public boolean canManage() {
        return this == OWNER || this == TEACHER || this == MODERATOR;
    }

    /**
     * Kiểm tra xem role có quyền gửi tin trong kênh readonly không
     */
    public boolean canPostInReadOnly() {
        return this == OWNER || this == TEACHER || this == MODERATOR;
    }
}
