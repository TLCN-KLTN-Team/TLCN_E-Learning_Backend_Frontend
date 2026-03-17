package demo.app.chat_app.model.workspace;

import com.fasterxml.jackson.annotation.JsonValue;
import lombok.Getter;

/**
 * Rich enum cho mức độ thông báo của Channel
 *
 * @code - Giá trị lưu trong database
 * @label - Giá trị hiển thị cho người dùng
 */
@Getter
public enum NotificationLevel {
    ALL("ALL", "Tất cả tin nhắn"),
    MENTIONS("MENTIONS", "Chỉ khi được nhắc đến"),
    MUTED("MUTED", "Tắt thông báo");

    @JsonValue
    private final String code;
    private final String label;

    NotificationLevel(String code, String label) {
        this.code = code;
        this.label = label;
    }

    /**
     * Tìm NotificationLevel từ code
     */
    public static NotificationLevel fromCode(String code) {
        for (NotificationLevel level : values()) {
            if (level.code.equals(code)) {
                return level;
            }
        }
        throw new IllegalArgumentException("Unknown NotificationLevel code: " + code);
    }

    /**
     * Kiểm tra xem có cần gửi thông báo cho message thường không
     */
    public boolean shouldNotifyForRegularMessage() {
        return this == ALL;
    }

    /**
     * Kiểm tra xem có cần gửi thông báo khi được mention không
     */
    public boolean shouldNotifyForMention() {
        return this == ALL || this == MENTIONS;
    }
}
