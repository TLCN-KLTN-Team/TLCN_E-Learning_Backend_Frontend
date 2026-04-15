package com.hoangphihiep.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EducationalUnitRegistrationRequest {
    // Training unit information
    private String name;
    private String type;
    private String address;
    private String phone;
    private String email;
    private String website;
    private String description;
    private Integer establishedYear;

    // File uploads
    private MultipartFile logo;
    private MultipartFile businessLicense;
    private MultipartFile businessLicenseOriginal;
    private MultipartFile businessLicenseSigned;

    // Admin account information
    private String adminName;
    private String adminPassword;
    private String adminConfirmPassword; // thêm để khớp với frontend

    // Representative information
    private String representativeName;
    private String representativePosition;
    private String representativePhone;
    private String representativeEmail;
}
