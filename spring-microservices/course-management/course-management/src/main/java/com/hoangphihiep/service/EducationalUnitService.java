package com.hoangphihiep.service;

import com.hoangphihiep.dto.request.TrainingUnitRegistrationRequest;
import com.hoangphihiep.dto.request.UserRequest;
import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.EducationalUnitResponse;
import com.hoangphihiep.dto.response.TrainingUnitRegistrationResponse;
import com.hoangphihiep.dto.response.UserResponse;
import com.hoangphihiep.entity.EducationalUnit;
import com.hoangphihiep.entity.SubscriptionPlan;
import com.hoangphihiep.exception.AppException;
import com.hoangphihiep.exception.ErrorCode;
import com.hoangphihiep.repository.EducationalUnitRepository;
import com.hoangphihiep.repository.SubscriptionPlanRepository;
import com.hoangphihiep.repository.httpclient.FileHandlerRepository;
import com.hoangphihiep.repository.httpclient.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class EducationalUnitService {

    private final EducationalUnitRepository educationalUnitRepository;
    private final UserRepository userRepository;
    private final FileHandlerRepository fileHandlerRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    public EducationalUnitResponse getInstitutionByAdminId(String adminId) {
        if (adminId == null || adminId.trim().isEmpty()) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        try {
            Optional<EducationalUnit> institution = educationalUnitRepository.findByIdAdmin(adminId);

            if (institution.isEmpty()) {
                log.warn("No institution found for admin ID: {}", adminId);
                return null;
            }

            EducationalUnit edu = institution.get();
            log.info("Found institution {} for admin ID: {}", edu.getName(), adminId);

            return EducationalUnitResponse.builder()
                    .id(String.valueOf(edu.getId()))
                    .name(edu.getName())
                    .type(edu.getType())
                    .address(edu.getAddress())
                    .phone(edu.getPhone())
                    .email(edu.getEmail())
                    .website(edu.getWebsite())
                    .logo(edu.getLogo())
                    .description(edu.getDescription())
                    .establishedYear(edu.getEstablishedYear())
                    .status(edu.getStatus())
                    .subscriptionStartDate(edu.getSubscriptionStartDate())
                    .subscriptionEndDate(edu.getSubscriptionEndDate())
                    .createdAt(edu.getCreatedAt())
                    .build();

        } catch (Exception e) {
            log.error("Error occurred while checking institution for admin: {}", adminId, e);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    @Transactional
    public TrainingUnitRegistrationResponse registerTrainingUnit(TrainingUnitRegistrationRequest request) {
        log.info("Starting training unit registration for: {}", request.getName());

        try {
            // 1. Create admin user account in identity-service
            UserRequest adminUserRequest = UserRequest.builder()
                    .username(request.getAdminName())
                    .email(request.getRepresentativeEmail())
                    .password(request.getAdminPassword())
                    .firstName(request.getRepresentativeName().split(" ")[0])
                    .lastName(request.getRepresentativeName().substring(
                            request.getRepresentativeName().indexOf(" ") + 1))
                    .phone(request.getRepresentativePhone())
                    .build();

            log.info("Creating admin user account for email: {}", request.getRepresentativeEmail());
            ApiResponse<UserResponse> userResponse = userRepository.createUser(adminUserRequest);

            if (userResponse == null || userResponse.getResult() == null) {
                throw new RuntimeException("Failed to create admin user account");
            }

            String adminUserId = userResponse.getResult().getId();
            log.info("Admin user created successfully with ID: {}", adminUserId);

            // 2. Upload logo if provided
            String logoUrl = null;
            if (request.getLogo() != null && !request.getLogo().isEmpty()) {
                log.info("Uploading logo file");
                try {
                    ApiResponse<List<String>> logoUploadResponse = fileHandlerRepository.uploadFile(request.getLogo());
                    if (logoUploadResponse != null && logoUploadResponse.getResult() != null
                            && !logoUploadResponse.getResult().isEmpty()) {
                        logoUrl = logoUploadResponse.getResult().get(0); // Lấy URL đầu tiên
                        log.info("Logo uploaded successfully. URL: {}", logoUrl);
                    } else {
                        log.warn("Failed to upload logo file");
                    }
                } catch (Exception e) {
                    log.error("Error uploading logo: {}", e.getMessage(), e);
                }
            }

            // 3. Upload business license if provided
            String businessLicenseUrl = null;
            if (request.getBusinessLicense() != null && !request.getBusinessLicense().isEmpty()) {
                log.info("Uploading business license file");
                try {
                    ApiResponse<List<String>> licenseUploadResponse = fileHandlerRepository.uploadFile(request.getBusinessLicense());
                    if (licenseUploadResponse != null && licenseUploadResponse.getResult() != null
                            && !licenseUploadResponse.getResult().isEmpty()) {
                        businessLicenseUrl = licenseUploadResponse.getResult().get(0); // Lấy URL đầu tiên
                        log.info("Business license uploaded successfully. URL: {}", businessLicenseUrl);
                    } else {
                        log.warn("Failed to upload business license file");
                    }
                } catch (Exception e) {
                    log.error("Error uploading business license: {}", e.getMessage(), e);
                }
            }

            SubscriptionPlan subscriptionPlan = subscriptionPlanRepository.findSubscriptionPlanById(1L);
            // 4. Create training unit in course-management database
            EducationalUnit educationalUnit = EducationalUnit.builder()
                    .name(request.getName())
                    .type(request.getType())
                    .address(request.getAddress())
                    .phone(request.getPhone())
                    .email(request.getEmail())
                    .website(request.getWebsite())
                    .description(request.getDescription())
                    .establishedYear(request.getEstablishedYear())
                    .logo(logoUrl) // Set logo URL
                    .businessLicense(businessLicenseUrl) // Set business license URL (you'll need to add this field)
                    .idAdmin(adminUserId)
                    .status("PENDING")
                    .createdAt(new Date())
                    .subscriptionPlan(subscriptionPlan)
                    .subscriptionStartDate(new Date())
                    .subscriptionEndDate(new Date())
                    .build();

            EducationalUnit savedUnit = educationalUnitRepository.save(educationalUnit);
            log.info("Training unit saved successfully with ID: {}", savedUnit.getId());

            // 5. Build and return response
            return TrainingUnitRegistrationResponse.builder()
                    .id(savedUnit.getId().toString())
                    .name(savedUnit.getName())
                    .type(savedUnit.getType())
                    .address(savedUnit.getAddress())
                    .phone(savedUnit.getPhone())
                    .email(savedUnit.getEmail())
                    .website(savedUnit.getWebsite())
                    .logo(logoUrl)
                    .businessLicense(businessLicenseUrl)
                    .description(savedUnit.getDescription())
                    .establishedYear(savedUnit.getEstablishedYear())
                    .status("ACTIVE")
                    .createdAt(savedUnit.getCreatedAt())
                    .adminAccountId(adminUserId)
                    .build();

        } catch (Exception e) {
            log.error("Error during training unit registration: {}", e.getMessage(), e);
            throw new RuntimeException("Training unit registration failed: " + e.getMessage());
        }
    }
}
