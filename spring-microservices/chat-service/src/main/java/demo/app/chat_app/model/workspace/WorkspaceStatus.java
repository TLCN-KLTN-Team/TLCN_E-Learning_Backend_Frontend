package demo.app.chat_app.model.workspace;

import com.fasterxml.jackson.annotation.JsonValue;
import lombok.Getter;

/**
 * Rich enum cho trạng thái của Workspace (Khóa học)
 *
 * @code - Giá trị lưu trong database
 * @label - Giá trị hiển thị cho người dùng
 */
@Getter
public enum WorkspaceStatus {
    ACTIVE("ACTIVE", "Đang hoạt động"),
    ARCHIVED("ARCHIVED", "Đã lưu trữ");

    @JsonValue
    private final String code;
    private final String label;

    WorkspaceStatus(String code, String label) {
        this.code = code;
        this.label = label;
    }

    /**
     * Tìm WorkspaceStatus từ code
     */
    public static WorkspaceStatus fromCode(String code) {
        for (WorkspaceStatus status : values()) {
            if (status.code.equals(code)) {
                return status;
            }
        }
        throw new IllegalArgumentException("Unknown WorkspaceStatus code: " + code);
    }
}
