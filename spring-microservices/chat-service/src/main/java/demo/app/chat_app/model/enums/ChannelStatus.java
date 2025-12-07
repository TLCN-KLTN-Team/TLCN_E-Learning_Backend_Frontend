package demo.app.chat_app.model.enums;

import lombok.Getter;

@Getter
public enum ChannelStatus {
    ACTIVE("ACTIVE"),     // Đang hoạt động
    ENDED("ENDED"),      // Kết thúc, chờ giáo viên kiểm tra
    DELETED("DELETED");     // Đã xoá hẳn

    private final String status;

    ChannelStatus(String status) {
        this.status = status;
    }
}
