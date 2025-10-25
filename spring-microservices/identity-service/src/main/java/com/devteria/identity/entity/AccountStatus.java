package com.devteria.identity.entity;

import lombok.Getter;

@Getter
public enum AccountStatus {
    PENDING_VERIFICATION("PENDING_VERIFICATION"),
    ACTIVE("ACTIVE"),
    INACTIVE("INACTIVE"),
    BANNED("BANNED");

    AccountStatus(String status) {
        this.status = status;
    }

    private final String status;
}
