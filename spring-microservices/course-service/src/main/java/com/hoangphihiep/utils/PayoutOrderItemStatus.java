package com.hoangphihiep.utils;

import lombok.Getter;

@Getter
public enum PayoutOrderItemStatus {
    HELD("Trong thời gian giữ tạm tiền"),
    RELEASED("Giữ tạm tiền đã được giải phóng và phân chia"),
    ACCRUED("Đang chờ thanh toán"),
    ATTACHED_TO_PAYOUT("Đã gắn với yêu cầu thanh toán"),
    SETTLED("Đã được thanh toán"),
    REVERSED("Đã hoàn tiền"),
    REVERSED_AFTER_SETTLEMENT("Đã hoàn tác sau khi quyết toán"),
    REFUNDED("Hoàn tiền trong thời gian giữ tạm tiền");

    private final String description;

    PayoutOrderItemStatus(String description) {
        this.description = description;
    }
}