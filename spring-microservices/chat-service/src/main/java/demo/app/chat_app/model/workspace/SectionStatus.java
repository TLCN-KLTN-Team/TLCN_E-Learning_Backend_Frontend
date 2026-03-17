package demo.app.chat_app.model.workspace;

import com.fasterxml.jackson.annotation.JsonValue;
import lombok.Getter;

/**
 * Rich enum cho trạng thái của Section (Lớp học)
 *
 * @code - Giá trị lưu trong database
 * @label - Giá trị hiển thị cho người dùng
 */
@Getter
public enum SectionStatus {
    ACTIVE("ACTIVE", "Đang hoạt động"),
    FINISHED("FINISHED", "Đã kết thúc"),
    LOCKED("LOCKED", "Đã khóa");

    @JsonValue
    private final String code;
    private final String label;

    SectionStatus(String code, String label) {
        this.code = code;
        this.label = label;
    }

    /**
     * Tìm SectionStatus từ code
     */
    public static SectionStatus fromCode(String code) {
        for (SectionStatus status : values()) {
            if (status.code.equals(code)) {
                return status;
            }
        }
        throw new IllegalArgumentException("Unknown SectionStatus code: " + code);
    }
}
