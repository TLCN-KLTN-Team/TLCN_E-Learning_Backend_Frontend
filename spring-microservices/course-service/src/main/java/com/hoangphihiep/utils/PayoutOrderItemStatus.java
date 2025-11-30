package com.hoangphihiep.utils;

import lombok.Getter;

@Getter
public enum PayoutOrderItemStatus {
    ACCRUED("Accrued - Waiting for payout"),
    ATTACHED_TO_PAYOUT("Attached to payout request"),
    SETTLED("Settled - Paid out"),
    REVERSED("Reversed - Refunded"),
    REVERSED_AFTER_SETTLEMENT("Reversed after settlement");

    private final String description;

    PayoutOrderItemStatus(String description) {
        this.description = description;
    }
}