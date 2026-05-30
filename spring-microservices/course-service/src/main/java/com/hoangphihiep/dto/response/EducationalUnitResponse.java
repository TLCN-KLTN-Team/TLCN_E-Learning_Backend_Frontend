package com.hoangphihiep.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EducationalUnitResponse {
    private Integer id;

    private String name;

    private String type;

    private String address;

    private String phone;

    private String email;

    private String website;

    // URL on cloud
    private String logo;

    public String businessLicense;

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

    private Integer totalDepartments;

    private Integer totalCourses;

    private Integer totalTeachers;

    private Integer totalStudents;

    private Set<DepartmentResponse> departments;

    // representative info
    private String representativeName;
    private String representativeEmail;
    private String representativePhone;
}
