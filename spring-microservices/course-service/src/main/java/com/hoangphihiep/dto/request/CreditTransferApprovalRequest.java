package com.hoangphihiep.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CreditTransferApprovalRequest {
    private String status; // APPROVED, REJECTED
    private String rejectionReason; // Required if REJECTED
    private String note; // Optional for APPROVED
}
