package com.hoangphihiep.utils;

import lombok.Getter;

@Getter
public enum SignatureVerificationStatus {
    UNVERIFIED("UNVERIFIED"),
    VERIFIED_UNMODIFIED("VERIFIED_UNMODIFIED"),
    VERIFIED_BUT_MODIFIED("VERIFIED_BUT_MODIFIED"),
    INVALID_UNTRUSTED_CA("INVALID_UNTRUSTED_CA"),
    INVALID_REVOKED("INVALID_REVOKED"),
    INVALID_EXPIRED("INVALID_EXPIRED"),
    INVALID_NO_TIMESTAMP("INVALID_NO_TIMESTAMP"),
    INVALID_PARSE_ERROR("INVALID_PARSE_ERROR"),
    LEGACY_UNVERIFIED("LEGACY_UNVERIFIED"),
    INVALID("INVALID");

    private final String value;

    SignatureVerificationStatus(String value) {
        this.value = value;
    }

    public boolean canApprove() {
        return this == VERIFIED_UNMODIFIED;
    }
}
