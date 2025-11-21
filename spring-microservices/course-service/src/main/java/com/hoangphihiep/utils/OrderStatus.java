package com.hoangphihiep.utils;

import lombok.Getter;

@Getter
public enum OrderStatus {
    PENDING,
    COMPLETED,
    CANCELLED;

    private final String status;

    OrderStatus() {
        this.status = this.name();
    }

}
