package com.devteria.identity.entity;

import lombok.Getter;

@Getter
public enum AccountStatus {
    ACTIVE("ACTIVE"),
    INACTIVE("INACTIVE"),
    BANNED("BANNED"),
    PENDING_VERIFICATION("PENDING_VERIFICATION");

    AccountStatus(String status) {
        this.status = status;
    }

    private final String status;
}
