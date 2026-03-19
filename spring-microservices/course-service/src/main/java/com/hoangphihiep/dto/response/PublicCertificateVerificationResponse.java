package com.hoangphihiep.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PublicCertificateVerificationResponse {
    private boolean found;
    private CertificateResponse certificate;

    private boolean onChainChecked;
    private Boolean onChainValid;
    private Boolean dataMatched;

    private String onChainUserId;
    private Integer onChainPublishedCourseId;
    private Date onChainIssueDate;

    private String message;
}
