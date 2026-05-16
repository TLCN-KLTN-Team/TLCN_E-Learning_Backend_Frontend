package com.hoangphihiep.dto.response;

import com.hoangphihiep.utils.SignatureVerificationStatus;
import lombok.Builder;
import lombok.Getter;

import java.util.Date;

@Getter
@Builder
public class SignatureVerificationResponse {
    private SignatureVerificationStatus status;
    private String errorCode;
    private String errorReason;
    private String warning;
    private boolean hasTimestamp;
    private String revocationStatus;
    private Date verifiedAt;
    private Date certificateExpiryDate;

    public static SignatureVerificationResponse invalid(SignatureVerificationStatus status, String errorCode, String errorReason) {
        return SignatureVerificationResponse.builder()
                .status(status)
                .errorCode(errorCode)
                .errorReason(errorReason)
                .warning(null)
                .hasTimestamp(false)
                .revocationStatus("MANUAL_REVIEW_REQUIRED")
                .verifiedAt(new Date())
                .certificateExpiryDate(null)
                .build();
    }

    public SignatureVerificationResponseBuilder toBuilder() {
        return SignatureVerificationResponse.builder()
                .status(this.status)
                .errorCode(this.errorCode)
                .errorReason(this.errorReason)
                .warning(this.warning)
                .hasTimestamp(this.hasTimestamp)
                .revocationStatus(this.revocationStatus)
                .verifiedAt(this.verifiedAt)
                .certificateExpiryDate(this.certificateExpiryDate);
    }
}