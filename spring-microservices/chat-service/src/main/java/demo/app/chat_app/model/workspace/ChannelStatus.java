package demo.app.chat_app.model.workspace;

import com.fasterxml.jackson.annotation.JsonValue;
import lombok.Getter;

/**
 * Rich enum cho trạng thái của Channel
 *
 * @code - Giá trị lưu trong database
 * @label - Giá trị hiển thị cho người dùng
 */
@Getter
public enum ChannelStatus {
    ACTIVE("ACTIVE", "Đang hoạt động"),
    LOCKED("LOCKED", "Đã khóa"),
    ARCHIVED("ARCHIVED", "Đã lưu trữ"),
    DELETED("DELETED", "Đã xóa");

    @JsonValue
    private final String code;
    private final String label;

    ChannelStatus(String code, String label) {
        this.code = code;
        this.label = label;
    }

    /**
     * Tìm ChannelStatus từ code
     */
    public static ChannelStatus fromCode(String code) {
        for (ChannelStatus status : values()) {
            if (status.code.equals(code)) {
                return status;
            }
        }
        throw new IllegalArgumentException("Unknown ChannelStatus code: " + code);
    }
}
