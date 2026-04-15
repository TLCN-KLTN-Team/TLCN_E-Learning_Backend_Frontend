package com.hoangphihiep.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EducationUnitRegistrationResponse {
    private Integer id;
    private String name;
    private String type;
    private String address;
    private String phone;
    private String email;
    private String website;
    private String logo;
    private String businessLicense;
    private String businessLicenseOriginal;
    private String businessLicenseSigned;
    private String businessLicenseOriginalHash;
    private String businessLicenseSignedHash;
    private String signatureStatus;
    private String signatureErrorCode;
    private String signatureErrorReason;
    private String signatureWarning;
    private String signatureRevocationStatus;
    private Date signatureVerifiedAt;
    private Date certificateExpiryDate;
    private String description;
    private Integer establishedYear;
    private String status;
    private Date createdAt;
    private String adminAccountId;
}
