package demo.app.chat_app.model.enums;

import lombok.Getter;

@Getter
public enum ChannelStatus {
    ACTIVE,     // Đang hoạt động
    ENDED,      // Kết thúc, chờ giáo viên kiểm tra
    DELETED     // Đã xoá hẳn
}
