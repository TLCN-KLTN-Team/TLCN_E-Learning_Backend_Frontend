package demo.app.chat_app.model.workspace;

import com.fasterxml.jackson.annotation.JsonValue;
import lombok.Getter;

/**
 * Rich enum cho phạm vi của Channel
 *
 * @code - Giá trị lưu trong database
 * @label - Giá trị hiển thị cho người dùng
 */
@Getter
public enum ChannelScope {
    MAIN("MAIN", "Kênh chính"),
    GROUP("GROUP", "Kênh nhóm");

    @JsonValue
    private final String code;
    private final String label;

    ChannelScope(String code, String label) {
        this.code = code;
        this.label = label;
    }

    /**
     * Tìm ChannelScope từ code
     */
    public static ChannelScope fromCode(String code) {
        for (ChannelScope scope : values()) {
            if (scope.code.equals(code)) {
                return scope;
            }
        }
        throw new IllegalArgumentException("Unknown ChannelScope code: " + code);
    }
}
