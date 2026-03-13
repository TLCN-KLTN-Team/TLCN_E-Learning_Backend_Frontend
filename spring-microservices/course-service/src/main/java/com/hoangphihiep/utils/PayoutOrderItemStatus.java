package com.hoangphihiep.utils;

import lombok.Getter;

@Getter
public enum PayoutOrderItemStatus {
    HELD("Held - In escrow period"),
    RELEASED("Released - Escrow released and split"),
    ACCRUED("Accrued - Waiting for payout"),
    ATTACHED_TO_PAYOUT("Attached to payout request"),
    SETTLED("Settled - Paid out"),
    REVERSED("Reversed - Refunded"),
    REVERSED_AFTER_SETTLEMENT("Reversed after settlement"),
    REFUNDED("Refunded - Refunded during escrow period");

    private final String description;

    PayoutOrderItemStatus(String description) {
        this.description = description;
    }
}