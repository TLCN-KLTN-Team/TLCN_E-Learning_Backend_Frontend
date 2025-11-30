package com.hoangphihiep.utils;

public enum PayoutPayoutStatus {
    PENDING("Pending approval"),
    APPROVED("Approved - Ready to process"),
    PROCESSING("Processing payment"),
    COMPLETED("Completed successfully"),
    FAILED("Payment failed"),
    CANCELLED("Cancelled by admin");

    private final String description;

    PayoutPayoutStatus(String description) {
        this.description = description;
    }
}
