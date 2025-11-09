package com.hoangphihiep.service;

import com.hoangphihiep.dto.request.EducationalUnitRegistrationRequest;
import com.hoangphihiep.dto.request.UserRequest;
import com.hoangphihiep.dto.response.*;
import com.hoangphihiep.entity.EducationalUnit;
import com.hoangphihiep.entity.SubscriptionPlan;
import com.hoangphihiep.exception.AppException;
import com.hoangphihiep.exception.ErrorCode;
import com.hoangphihiep.mapper.EducationalUnitMapper;
import com.hoangphihiep.repository.EducationalUnitRepository;
import com.hoangphihiep.repository.SubscriptionPlanRepository;
import com.hoangphihiep.repository.httpclient.FileHandlerRepository;
import com.hoangphihiep.repository.httpclient.UserInfoApi;
import com.hoangphihiep.repository.httpclient.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
@Slf4j
public class EducationalUnitService {

    private final EducationalUnitRepository educationalUnitRepository;
    private final UserRepository userRepository;
    private final FileHandlerRepository fileHandlerRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final EducationalUnitMapper educationalUnitMapper;
    private final UserInfoApi userInfoApi;
    private final EmailService emailService;

    public PaginatedResponse<EducationalUnitResponse> getAllEducationalUnits(int page, int size){
        Pageable pageable = PageRequest.of(page, size);
        Page<EducationalUnit> educationalUnits = educationalUnitRepository.findAll(pageable);
        List<EducationalUnitResponse> educationalUnitResponses =
                educationalUnits.getContent().stream()
                        .map(eu -> {
                            EducationalUnitResponse response = educationalUnitMapper.toEducationalUnitResponse(eu);
                            // Fetch and set representative info
                            UserResponse userInfo = userInfoApi.getUserInfo(eu.getIdAdmin()).getResult();
                            log.info("Fetched user info for admin ID {}: {}", eu.getIdAdmin(), userInfo);
                            response.setRepresentativeName(userInfo.getFirstName() + " " + userInfo.getLastName());
                            response.setRepresentativeEmail(userInfo.getEmail());
                            response.setRepresentativePhone(userInfo.getPhoneNumber());

                            return response;
                        })
                        .toList();

        return PaginatedResponse.<EducationalUnitResponse>builder()
                .content(educationalUnitResponses)
                .page(page)
                .size(size)
                .totalElements(educationalUnits.getTotalElements())
                .totalPages(educationalUnits.getTotalPages())
                .first(educationalUnits.isFirst())
                .last(educationalUnits.isLast())
                .hasNext(educationalUnits.hasNext())
                .hasPrevious(educationalUnits.hasPrevious())
                .build();
    }

    public EducationalUnitResponse getEducationalUnitByAdminId(String adminId) {
        if (adminId == null || adminId.trim().isEmpty()) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        try {
            Optional<EducationalUnit> educationalUnit = educationalUnitRepository.findByIdAdmin(adminId);

            if (educationalUnit.isEmpty()) {
                return null;
            }

            UserResponse userInfo = userInfoApi.getUserInfo(adminId).getResult();

            EducationalUnit edu = educationalUnit.get();

            return EducationalUnitResponse.builder()
                    .id(edu.getId())
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
                    .representativeName(userInfo.getFirstName() + " " + userInfo.getLastName())
                    .representativeEmail(userInfo.getEmail())
                    .representativePhone(userInfo.getPhoneNumber())
                    .build();

        } catch (Exception e) {
            log.error("Error occurred while checking institution for admin: {}", adminId, e);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    @Transactional
    public EducationUnitRegistrationResponse registerEducationalUnit(EducationalUnitRegistrationRequest request) {
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
                    Map<String, String> logoUploadResponse = fileHandlerRepository.uploadFile(request.getLogo());
                    logoUrl = logoUploadResponse.get("url");
                } catch (Exception e) {
                    log.error("Error uploading logo: {}", e.getMessage(), e);
                }
            }

            // 3. Upload business license if provided
            String businessLicenseUrl = null;
            if (request.getBusinessLicense() != null && !request.getBusinessLicense().isEmpty()) {
                log.info("Uploading business license file");
                try {
                    Map<String, String> licenseUploadResponse = fileHandlerRepository.uploadFile(request.getBusinessLicense());
                    businessLicenseUrl = licenseUploadResponse.get("url");
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
            return EducationUnitRegistrationResponse.builder()
                    .id(savedUnit.getId())
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

        } catch (AppException e) {
            // Re-throw AppException as-is to preserve the original error
            log.error("AppException during training unit registration: {}", e.getMessage(), e);
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error during training unit registration: {}", e.getMessage(), e);
            // Only throw a generic error for truly unexpected exceptions
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    public void approveEducationalUnit(Integer id){
        EducationalUnit educationalUnit = educationalUnitRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.EDUCATIONAL_UNIT_NOT_FOUND));

        educationalUnit.setStatus("ACTIVE");
        educationalUnitRepository.save(educationalUnit);

        this.sendFeedback(id, "Đơn vị đào tạo của bạn đã được phê duyệt. Bạn có thể đăng nhập và bắt đầu sử dụng hệ thống.");
    }

    public void sendFeedback(Integer unitId, String feedback) {
        EducationalUnit entity = educationalUnitRepository.findById(unitId)
                .orElseThrow(() -> new AppException(ErrorCode.EDUCATIONAL_UNIT_NOT_FOUND));

        CompletableFuture<Boolean> future = emailService.sendFeedbackForRegisteredEducationalUnit(entity.getEmail(), entity.getName(), feedback);
        future.whenComplete((emailSent, error) -> {
            if (error != null) {
                throw new AppException(ErrorCode.EMAIL_SENDING_FAILED);
            } else if (!emailSent) {
                throw new AppException(ErrorCode.EMAIL_SENDING_FAILED);
            }
        });
    }
}
