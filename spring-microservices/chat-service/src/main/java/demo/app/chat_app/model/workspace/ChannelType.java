package demo.app.chat_app.model.workspace;

import com.fasterxml.jackson.annotation.JsonValue;
import lombok.Getter;

/**
 * Rich enum cho loại Channel
 *
 * @code - Giá trị lưu trong database
 * @label - Giá trị hiển thị cho người dùng
 */
@Getter
public enum ChannelType {
    TEXT("TEXT", "Kênh văn bản"),
    VOICE("VOICE", "Kênh thoại");

    @JsonValue
    private final String code;
    private final String label;

    ChannelType(String code, String label) {
        this.code = code;
        this.label = label;
    }

    /**
     * Tìm ChannelType từ code
     */
    public static ChannelType fromCode(String code) {
        for (ChannelType type : values()) {
            if (type.code.equals(code)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Unknown ChannelType code: " + code);
    }
}
