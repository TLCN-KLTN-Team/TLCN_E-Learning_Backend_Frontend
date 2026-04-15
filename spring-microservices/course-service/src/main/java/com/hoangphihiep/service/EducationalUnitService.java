package com.hoangphihiep.service;

import com.hoangphihiep.dto.request.EducationalUnitRegistrationRequest;
import com.hoangphihiep.dto.request.EducationalUnitRequest;
import com.hoangphihiep.dto.request.StatusUpdateRequest;
import com.hoangphihiep.dto.request.UserRequest;
import com.hoangphihiep.dto.response.*;
import com.hoangphihiep.entity.Department;
import com.hoangphihiep.entity.Course;
import com.hoangphihiep.entity.CourseProgress;
import com.hoangphihiep.entity.EducationalUnit;
import com.hoangphihiep.entity.SubscriptionPlan;
import com.hoangphihiep.exception.AppException;
import com.hoangphihiep.exception.ErrorCode;
import com.hoangphihiep.mapper.EducationalUnitMapper;
import com.hoangphihiep.repository.*;
import com.hoangphihiep.repository.httpclient.*;
import com.hoangphihiep.utils.CurrencyUtils;
import com.hoangphihiep.utils.EducationalUnitStatus;
import com.hoangphihiep.utils.SignatureVerificationStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.security.MessageDigest;
import java.util.*;
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
    private final CourseRepository courseRepository;
    private final DepartmentRepository departmentRepository;
    private final StudentRepository studentRepository;
    private final CourseProgressRepository courseProgressRepository;
    private final UserInfoApi userInfoApi;
    private final EmailService emailService;
    private final TeacherRepository teacherRepository;
    private final DepartmentRepository departmentRepo;
    private final CurrencyUtils currencyUtils;
    private final ExpertRepository expertRepository;
    private final BusinessLicenseSignatureVerificationService businessLicenseSignatureVerificationService;
    private final RestTemplate restTemplate;

    public List<EducationalUnitCardResponse> getAllEducationalUnits() {
        List<EducationalUnit> educationalUnits = educationalUnitRepository.findAll();
        return educationalUnits.stream()
                .filter(educationalUnit -> educationalUnit.getStatus().equals(EducationalUnitStatus.ACTIVE))
                .map(educationalUnit -> {
                    List<String> departments = educationalUnit.getDepartments().stream()
                            .map(Department::getName)
                            .toList();
                    return EducationalUnitCardResponse.builder()
                            .id(educationalUnit.getId())
                            .name(educationalUnit.getName())
                            .address(educationalUnit.getAddress())
                            .logo(educationalUnit.getLogo())
                            .establishedYear(educationalUnit.getEstablishedYear())
                            .departments(departments)
                            .type(educationalUnit.getType())
                            .build();
                }).toList();
    }

    public EducationalUnitDetailResponse getEducationalUnitById(Integer id) {
        EducationalUnit educationalUnit = educationalUnitRepository.findById(id).orElseThrow(
                () -> new AppException(ErrorCode.EDUCATIONAL_UNIT_NOT_FOUND)
        );
        long totalStudents = 0;

        List<TeacherResponse> teachers;
        try {
            totalStudents = studentRepository.countStudentsByEducationalUnit(id).getResult();
            teachers = teacherRepository
                    .getTeachersByEducationalUnitNoPage(id).getResult();
        } catch (Exception e) {
            log.error(e.getMessage());
            throw new AppException(ErrorCode.FEIGN_CLIENT_ERROR);
        }

        return EducationalUnitDetailResponse.builder()
                .id(educationalUnit.getId())
                .name(educationalUnit.getName())
                .address(educationalUnit.getAddress())
                .logo(educationalUnit.getLogo())
                .establishedYear(educationalUnit.getEstablishedYear())
                .phone(educationalUnit.getPhone())
                .email(educationalUnit.getEmail())
                .website(educationalUnit.getWebsite())
                .description(educationalUnit.getDescription())
                .establishedYear(educationalUnit.getEstablishedYear())
                .totalStudents(totalStudents)
                .departments(educationalUnit.getDepartments()
                        .stream()
                        .map(Department::getName)
                        .toList()
                )
                .teachers(teachers.stream()
                        .map(teacher -> {
                            Department department = departmentRepo.findById(Integer.parseInt(teacher.getDepartmentId()))
                                    .orElseThrow(() -> new AppException(ErrorCode.DEPARTMENT_NOT_FOUND));
                            return EducationalUnitDetailResponse.Teacher.builder()
                                    .id(teacher.getTeacherId())
                                    .name(teacher.getLastName() + " " + teacher.getFirstName())
                                    .avatarUrl(teacher.getAvatarUrl())
                                    .departmentName(department.getName())
                                    .build();
                        }).toList()
                )
                .courses(Optional.ofNullable(educationalUnit.getCourses())
                        .orElse(Collections.emptySet())
                        .stream()
                        .filter(course -> course.getPublishedCourse() != null)
                        .map(course -> EducationalUnitDetailResponse.Course.builder()
                                .id(course.getPublishedCourse().getId())
                                .name(course.getCourseName())
                                .description(course.getDescription())
                                .coverImageUrl(course.getPublishedCourse().getCourseImage())
                                .price(currencyUtils.formatCurrency(course.getPublishedCourse().getCoursePrice()))
                                .duration(50)
                                .numberOfStudents(500)
                                .averageRating(5)
                                .build())
                        .toList()
                )
                .build();
    }

    public PaginatedResponse<EducationalUnitResponse> getAllEducationalUnitsAtSuperAdmin(int page, int size){
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
                .build();
    }

    public EducationalUnitResponse getEducationalUnitByAdminId(String adminId) {
        return getEducationalUnitByMemberId(adminId);
    }

    public EducationalUnitResponse getEducationalUnitByMemberId(String userId) {
        if (userId == null || userId.trim().isEmpty()) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        try {
            Optional<EducationalUnit> educationalUnit = educationalUnitRepository.findByIdAdmin(userId);

            if (educationalUnit.isEmpty()) {
                try {
                ApiResponse<TeacherResponse> teacherResponse = teacherRepository.getTeacherByUserId(userId);
                if (teacherResponse != null && teacherResponse.getResult() != null) {
                    String educationalUnitIdStr = teacherResponse.getResult().getEducationalUnitId();
                        if (educationalUnitIdStr != null) {
                            Integer eduId = Integer.parseInt(educationalUnitIdStr);
                            educationalUnit = educationalUnitRepository.findById(eduId);
                        }
                    }
                } catch (Exception ex) {
                    // Ignore, maybe not a teacher
                }
            }

            // 3. If still not found, try Expert Profile
            if (educationalUnit.isEmpty()) {
                try {
                    ApiResponse<ExpertResponse> expertResponse = expertRepository.getExpertByUserId(userId);
                    if (expertResponse != null && expertResponse.getResult() != null) {
                        String educationalUnitIdStr = expertResponse.getResult().getEducationalUnitId();
                        if (educationalUnitIdStr != null) {
                            Integer eduId = Integer.parseInt(educationalUnitIdStr);
                            educationalUnit = educationalUnitRepository.findById(eduId);
                        }
                    }
                } catch (Exception ex) {
                   // Ignore
                }
            }
            
            if (educationalUnit.isEmpty()) {
                return null;
            }

            EducationalUnit edu = educationalUnit.get();
            
            UserResponse userInfo = null;
            try {
                // Get representative info (Admin) to display in response
                userInfo = userInfoApi.getUserInfo(edu.getIdAdmin()).getResult();
            } catch (Exception ex) {
                log.warn("Failed to get admin info for unit {}: {}", edu.getId(), ex.getMessage());
                userInfo = UserResponse.builder().email("").firstName("Unknown").lastName("User").phoneNumber("").build();
            }

            long totalCourses = courseRepository.countByEducationalUnitId(edu.getId());
            long totalDepartments = departmentRepository.countByEducationalUnitId(edu.getId());

            long totalTeachers = 0L;
            long totalStudents = 0L;
            try {
                totalTeachers = userInfoApi.countTeachersByEducationalUnit(edu.getId()).getResult();
            } catch (Exception ex) {
                log.warn("Failed to fetch teacher count for eduId {}: {}", edu.getId(), ex.getMessage());
            }
            try {
                totalStudents = userInfoApi.countStudentsByEducationalUnit(edu.getId()).getResult();
                System.out.println ("Tổng sinh viên trong đơn vị đào tạo 1: " + totalStudents);
            } catch (Exception ex) {
                log.warn("Failed to fetch student count for eduId {}: {}", edu.getId(), ex.getMessage());
            }

            return EducationalUnitResponse.builder()
                    .id(edu.getId())
                    .name(edu.getName())
                    .type(edu.getType())
                    .address(edu.getAddress())
                    .phone(edu.getPhone())
                    .email(edu.getEmail())
                    .website(edu.getWebsite())
                    .logo(edu.getLogo())
                    .businessLicense(edu.getBusinessLicense())
                    .businessLicenseOriginal(edu.getBusinessLicenseOriginal())
                    .businessLicenseSigned(edu.getBusinessLicenseSigned())
                    .businessLicenseOriginalHash(edu.getBusinessLicenseOriginalHash())
                    .businessLicenseSignedHash(edu.getBusinessLicenseSignedHash())
                    .signatureStatus(edu.getSignatureStatus() != null ? edu.getSignatureStatus().getValue() : SignatureVerificationStatus.UNVERIFIED.getValue())
                    .signatureErrorCode(edu.getSignatureErrorCode())
                    .signatureErrorReason(edu.getSignatureErrorReason())
                    .signatureWarning(edu.getSignatureWarning())
                    .signatureRevocationStatus(edu.getSignatureRevocationStatus())
                    .signatureVerifiedAt(edu.getSignatureVerifiedAt())
                    .certificateExpiryDate(edu.getCertificateExpiryDate())
                    .description(edu.getDescription())
                    .establishedYear(edu.getEstablishedYear())
                    .status(edu.getStatus().getStatus())
                    .subscriptionStartDate(edu.getSubscriptionStartDate())
                    .subscriptionEndDate(edu.getSubscriptionEndDate())
                    .createdAt(edu.getCreatedAt())
                    .totalCourses((int) totalCourses)
                    .totalDepartments((int) totalDepartments)
                    .totalTeachers((int) totalTeachers)
                    .totalStudents((int) totalStudents)
                    .representativeName(userInfo.getFirstName() + " " + userInfo.getLastName())
                    .representativeEmail(userInfo.getEmail())
                    .representativePhone(userInfo.getPhoneNumber())
                    .build();

        } catch (Exception e) {
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    @Transactional
    public EducationalUnitResponse updateEducationalUnit(String adminId, EducationalUnitRequest request) {
        log.info("Updating educational unit for admin: {}", adminId);

        // Find educational unit by admin ID
        EducationalUnit educationalUnit = educationalUnitRepository.findByIdAdmin(adminId)
                .orElseThrow(() -> new AppException(ErrorCode.EDUCATIONAL_UNIT_NOT_FOUND));

        // Update fields if provided
        if (request.getName() != null && !request.getName().trim().isEmpty()) {
            educationalUnit.setName(request.getName());
        }

        if (request.getType() != null) {
            educationalUnit.setType(request.getType());
        }

        if (request.getAddress() != null) {
            educationalUnit.setAddress(request.getAddress());
        }

        if (request.getPhone() != null) {
            educationalUnit.setPhone(request.getPhone());
        }

        if (request.getEmail() != null) {
            educationalUnit.setEmail(request.getEmail());
        }

        if (request.getWebsite() != null) {
            educationalUnit.setWebsite(request.getWebsite());
        }

        if (request.getDescription() != null) {
            educationalUnit.setDescription(request.getDescription());
        }

        if (request.getEstablishedYear() != null) {
            educationalUnit.setEstablishedYear(request.getEstablishedYear());
        }

        // Save updated entity
        EducationalUnit savedUnit = educationalUnitRepository.save(educationalUnit);
        log.info("Educational unit updated successfully with ID: {}", savedUnit.getId());

        // Get user info for response
        UserResponse userInfo = userInfoApi.getUserInfo(adminId).getResult();

        // Get counts
        long totalCourses = courseRepository.countByEducationalUnitId(savedUnit.getId());
        long totalDepartments = departmentRepository.countByEducationalUnitId(savedUnit.getId());

        long totalTeachers = 0L;
        long totalStudents = 0L;
        try {
            totalTeachers = userInfoApi.countTeachersByEducationalUnit(savedUnit.getId()).getResult();
        } catch (Exception ex) {
            log.warn("Failed to fetch teacher count: {}", ex.getMessage());
        }
        try {
            totalStudents = userInfoApi.countStudentsByEducationalUnit(savedUnit.getId()).getResult();
        } catch (Exception ex) {
            log.warn("Failed to fetch student count: {}", ex.getMessage());
        }

        // Build and return response
        return EducationalUnitResponse.builder()
                .id(savedUnit.getId())
                .name(savedUnit.getName())
                .type(savedUnit.getType())
                .address(savedUnit.getAddress())
                .phone(savedUnit.getPhone())
                .email(savedUnit.getEmail())
                .website(savedUnit.getWebsite())
                .logo(savedUnit.getLogo())
            .businessLicense(savedUnit.getBusinessLicense())
            .businessLicenseOriginal(savedUnit.getBusinessLicenseOriginal())
            .businessLicenseSigned(savedUnit.getBusinessLicenseSigned())
                .businessLicenseOriginalHash(savedUnit.getBusinessLicenseOriginalHash())
                .businessLicenseSignedHash(savedUnit.getBusinessLicenseSignedHash())
            .signatureStatus(savedUnit.getSignatureStatus() != null ? savedUnit.getSignatureStatus().getValue() : SignatureVerificationStatus.UNVERIFIED.getValue())
                .signatureErrorCode(savedUnit.getSignatureErrorCode())
                .signatureErrorReason(savedUnit.getSignatureErrorReason())
                .signatureWarning(savedUnit.getSignatureWarning())
                .signatureRevocationStatus(savedUnit.getSignatureRevocationStatus())
                .signatureVerifiedAt(savedUnit.getSignatureVerifiedAt())
                .certificateExpiryDate(savedUnit.getCertificateExpiryDate())
                .description(savedUnit.getDescription())
                .establishedYear(savedUnit.getEstablishedYear())
                .status(savedUnit.getStatus().getStatus())
                .subscriptionStartDate(savedUnit.getSubscriptionStartDate())
                .subscriptionEndDate(savedUnit.getSubscriptionEndDate())
                .createdAt(savedUnit.getCreatedAt())
                .totalCourses((int) totalCourses)
                .totalDepartments((int) totalDepartments)
                .totalTeachers((int) totalTeachers)
                .totalStudents((int) totalStudents)
                .representativeName(userInfo.getFirstName() + " " + userInfo.getLastName())
                .representativeEmail(userInfo.getEmail())
                .representativePhone(userInfo.getPhoneNumber())
                .build();
    }
    
    public Double getAverageInternalStudentRatio(String adminId) {
        try {
            Optional<EducationalUnit> educationalUnit = educationalUnitRepository.findByIdAdmin(adminId);
            if (educationalUnit.isEmpty()) {
                log.warn("No educational unit found for admin: {}", adminId);
                return 0.0;
            }
            
            Integer eduId = educationalUnit.get().getId();
            log.info("Calculating internal student ratio for educational unit ID: {}", eduId);
            
            // Get all courses for this educational unit
            List<Course> courses = courseRepository.findByEducationalUnitId(eduId);
            log.info("Found {} courses for educational unit {}", courses.size(), eduId);
            
            if (courses.isEmpty()) {
                log.info("No courses found for educational unit {}, returning 0.0", eduId);
                return 0.0;
            }
            
            double totalRatios = 0.0;
            int courseCount = 0;
            
            // For each course, calculate the ratio of internal students
            for (Course course : courses) {
                // Get all enrollments for this course with active progress
                List<CourseProgress> courseProgresses = courseProgressRepository.findByCourseId(course.getId());
                
                if (courseProgresses.isEmpty()) {
                    log.debug("No active progress records for course {}", course.getId());
                    continue;
                }
                
                // Filter only those with progress > 0
                List<CourseProgress> activeProgresses = courseProgresses.stream()
                        .filter(cp -> cp.getProgressPercentage() > 0)
                        .toList();
                
                if (activeProgresses.isEmpty()) {
                    log.debug("No active progress (>0%) for course {}", course.getId());
                    continue;
                }


                long totalStudents = userInfoApi.countStudentsByEducationalUnit(eduId).getResult();
                System.out.println ("id của edu: " + eduId);
                System.out.println ("Tổng sinh viên trong đơn vị đào tạo: " + totalStudents);
                int internalStudents = 0;
                
                // Check each student to see if they belong to the same educational unit
                for (CourseProgress progress : activeProgresses) {
                    try {
                        StudentResponse student = studentRepository.getStudentById(progress.getIdUser()).getResult();

                        Integer eduUnitId = Integer.parseInt(student.getEducationalUnitId());

                        if (eduUnitId.equals(eduId)) {
                            internalStudents++;
                        }
                    } catch (Exception e) {
                        log.warn("Failed to get educational unit for student {}: {}", progress.getIdUser(), e.getMessage());
                    }
                }
                
                double courseRatio = (double) internalStudents / totalStudents;
                log.debug("Course {}: {}/{} internal students = {}", course.getId(), internalStudents, totalStudents, courseRatio);
                
                totalRatios += courseRatio;
                courseCount++;
            }
            
            if (courseCount == 0) {
                log.info("No courses with active student progress found for educational unit {}, returning 0.0", eduId);
                return 0.0;
            }
            
            Double averageRatio = totalRatios / courseCount;
            log.info("Internal student ratio for educational unit {}: {}", eduId, averageRatio);
            
            return averageRatio;
        } catch (Exception e) {
            log.error("Error calculating average internal student ratio for admin {}: {}", adminId, e.getMessage(), e);
            return 0.0;
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

            MultipartFile signedLicense = getSignedLicenseFile(request);
            MultipartFile originalLicense = request.getBusinessLicenseOriginal();

            if (signedLicense == null || signedLicense.isEmpty()) {
                throw new RuntimeException("Vui lòng tải lên file PDF giấy phép hoạt động đã ký số.");
            }

            if (!isPdfFile(signedLicense)) {
                throw new RuntimeException("Giấy phép hoạt động đã ký số phải là định dạng PDF.");
            }

            if (originalLicense != null && !originalLicense.isEmpty() && !isPdfFile(originalLicense)) {
                throw new RuntimeException("Giấy phép hoạt động gốc phải là định dạng PDF.");
            }

                BusinessLicenseSignatureVerificationService.SignatureVerificationResult verificationResult =
                    businessLicenseSignatureVerificationService.verify(signedLicense);

                    if (verificationResult.getStatus() != SignatureVerificationStatus.VERIFIED_UNMODIFIED) {
                throw new RuntimeException(verificationResult.getErrorReason() != null
                    ? verificationResult.getErrorReason()
                    : "Không thể xác thực chữ ký số trong giấy phép đã nộp.");
                }

            // 3. Upload signed/original business license files
            String businessLicenseSignedUrl = null;
            String businessLicenseOriginalUrl = null;
            String businessLicenseSignedHash = computeSha256(signedLicense);
            String businessLicenseOriginalHash = computeSha256(originalLicense);

            log.info("Uploading signed business license file");
            try {
                Map<String, String> signedUploadResponse = fileHandlerRepository.uploadFile(signedLicense);
                businessLicenseSignedUrl = signedUploadResponse.get("url");
            } catch (Exception e) {
                log.error("Error uploading signed business license: {}", e.getMessage(), e);
                throw new RuntimeException("Không thể tải lên giấy phép đã ký số. Vui lòng thử lại.");
            }

            if (originalLicense != null && !originalLicense.isEmpty()) {
                log.info("Uploading original business license file");
                try {
                    Map<String, String> originalUploadResponse = fileHandlerRepository.uploadFile(originalLicense);
                    businessLicenseOriginalUrl = originalUploadResponse.get("url");
                } catch (Exception e) {
                    log.error("Error uploading original business license: {}", e.getMessage(), e);
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
                    .businessLicense(businessLicenseSignedUrl)
                    .businessLicenseSigned(businessLicenseSignedUrl)
                    .businessLicenseOriginal(businessLicenseOriginalUrl)
                    .businessLicenseSignedHash(businessLicenseSignedHash)
                    .businessLicenseOriginalHash(businessLicenseOriginalHash)
                    .signatureStatus(verificationResult.getStatus())
                    .signatureErrorCode(verificationResult.getErrorCode())
                    .signatureErrorReason(verificationResult.getErrorReason())
                    .signatureWarning(verificationResult.getWarning())
                    .signatureRevocationStatus(verificationResult.getRevocationStatus())
                    .signatureVerifiedAt(verificationResult.getVerifiedAt())
                    .certificateExpiryDate(verificationResult.getCertificateExpiryDate())
                    .idAdmin(adminUserId)
                    .status(EducationalUnitStatus.PENDING)
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
                    .businessLicense(savedUnit.getBusinessLicense())
                    .businessLicenseOriginal(savedUnit.getBusinessLicenseOriginal())
                    .businessLicenseSigned(savedUnit.getBusinessLicenseSigned())
                    .businessLicenseOriginalHash(savedUnit.getBusinessLicenseOriginalHash())
                    .businessLicenseSignedHash(savedUnit.getBusinessLicenseSignedHash())
                    .signatureStatus(savedUnit.getSignatureStatus() != null ? savedUnit.getSignatureStatus().getValue() : SignatureVerificationStatus.UNVERIFIED.getValue())
                    .signatureErrorCode(savedUnit.getSignatureErrorCode())
                    .signatureErrorReason(savedUnit.getSignatureErrorReason())
                    .signatureWarning(savedUnit.getSignatureWarning())
                    .signatureRevocationStatus(savedUnit.getSignatureRevocationStatus())
                    .signatureVerifiedAt(savedUnit.getSignatureVerifiedAt())
                    .certificateExpiryDate(savedUnit.getCertificateExpiryDate())
                    .description(savedUnit.getDescription())
                    .establishedYear(savedUnit.getEstablishedYear())
                    .status(savedUnit.getStatus().getStatus())
                    .createdAt(savedUnit.getCreatedAt())
                    .adminAccountId(adminUserId)
                    .build();

        } catch (AppException e) {
            // Re-throw AppException as-is to preserve the original error
            log.error("AppException during training unit registration: {}", e.getMessage(), e);
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error during training unit registration: {}", e.getMessage(), e);
            // Keep business validation/runtime message so frontend can show actionable feedback.
            if (e instanceof RuntimeException runtimeException) {
                throw runtimeException;
            }

            // Only throw a generic error for truly unexpected checked exceptions.
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    private MultipartFile getSignedLicenseFile(EducationalUnitRegistrationRequest request) {
        if (request.getBusinessLicenseSigned() != null && !request.getBusinessLicenseSigned().isEmpty()) {
            return request.getBusinessLicenseSigned();
        }

        if (request.getBusinessLicense() != null && !request.getBusinessLicense().isEmpty()) {
            return request.getBusinessLicense();
        }

        return null;
    }

    private boolean isPdfFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return false;
        }

        String contentType = file.getContentType();
        if (contentType != null && contentType.equalsIgnoreCase("application/pdf")) {
            return true;
        }

        String fileName = file.getOriginalFilename();
        return fileName != null && fileName.toLowerCase().endsWith(".pdf");
    }

    private String computeSha256(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return null;
        }

        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(file.getBytes());
            StringBuilder sb = new StringBuilder(hash.length * 2);
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception ex) {
            log.warn("Cannot compute SHA-256 for uploaded file {}: {}", file.getOriginalFilename(), ex.getMessage());
            return null;
        }
    }

    private String computeSha256(byte[] content) {
        if (content == null || content.length == 0) {
            return null;
        }

        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(content);
            StringBuilder sb = new StringBuilder(hash.length * 2);
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception ex) {
            log.warn("Cannot compute SHA-256 for byte content: {}", ex.getMessage());
            return null;
        }
    }

    private String appendWarning(String currentWarning, String extraWarning) {
        if (extraWarning == null || extraWarning.isBlank()) {
            return currentWarning;
        }

        if (currentWarning == null || currentWarning.isBlank()) {
            return extraWarning;
        }

        return currentWarning + " " + extraWarning;
    }

    @Transactional
    public void reverifyEducationalUnitSignature(Integer unitId) {
        EducationalUnit educationalUnit = educationalUnitRepository.findById(unitId)
                .orElseThrow(() -> new AppException(ErrorCode.EDUCATIONAL_UNIT_NOT_FOUND));

        String signedUrl = educationalUnit.getBusinessLicenseSigned() != null
                ? educationalUnit.getBusinessLicenseSigned()
                : educationalUnit.getBusinessLicense();

        if (signedUrl == null || signedUrl.isBlank()) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        byte[] signedBytes;
        try {
            signedBytes = restTemplate.getForObject(signedUrl, byte[].class);
        } catch (Exception ex) {
            log.error("Cannot download signed license for unit {}: {}", unitId, ex.getMessage(), ex);
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        if (signedBytes == null || signedBytes.length == 0) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        var verificationResult = businessLicenseSignatureVerificationService.verify(signedBytes, "reverify-signed-license.pdf");

        String warning = verificationResult.getWarning();
        String signedHash = computeSha256(signedBytes);

        if (educationalUnit.getBusinessLicenseSignedHash() != null
                && signedHash != null
                && !educationalUnit.getBusinessLicenseSignedHash().equalsIgnoreCase(signedHash)) {
            warning = appendWarning(warning, "Hash của bản signed đã thay đổi so với lần lưu trước.");
        }

        educationalUnit.setBusinessLicenseSignedHash(signedHash);
        educationalUnit.setSignatureStatus(verificationResult.getStatus());
        educationalUnit.setSignatureErrorCode(verificationResult.getErrorCode());
        educationalUnit.setSignatureErrorReason(verificationResult.getErrorReason());
        educationalUnit.setSignatureWarning(warning);
        educationalUnit.setSignatureRevocationStatus(verificationResult.getRevocationStatus());
        educationalUnit.setSignatureVerifiedAt(verificationResult.getVerifiedAt());
        educationalUnit.setCertificateExpiryDate(verificationResult.getCertificateExpiryDate());

        String originalUrl = educationalUnit.getBusinessLicenseOriginal();
        if (originalUrl != null && !originalUrl.isBlank()) {
            try {
                byte[] originalBytes = restTemplate.getForObject(originalUrl, byte[].class);
                String originalHash = computeSha256(originalBytes);

                if (educationalUnit.getBusinessLicenseOriginalHash() != null
                        && originalHash != null
                        && !educationalUnit.getBusinessLicenseOriginalHash().equalsIgnoreCase(originalHash)) {
                    educationalUnit.setSignatureWarning(appendWarning(
                            educationalUnit.getSignatureWarning(),
                            "Hash của bản gốc đã thay đổi so với lần lưu trước."
                    ));
                }

                educationalUnit.setBusinessLicenseOriginalHash(originalHash);
            } catch (Exception ex) {
                log.warn("Cannot re-download original license for unit {}: {}", unitId, ex.getMessage());
                educationalUnit.setSignatureWarning(appendWarning(
                        educationalUnit.getSignatureWarning(),
                        "Không thể tải lại bản gốc để kiểm tra hash."
                ));
            }
        }

        educationalUnitRepository.save(educationalUnit);
    }

    public void approveEducationalUnit(Integer id){
        EducationalUnit educationalUnit = educationalUnitRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.EDUCATIONAL_UNIT_NOT_FOUND));

        SignatureVerificationStatus signatureStatus = educationalUnit.getSignatureStatus();
        if (signatureStatus == null || !signatureStatus.canApprove()) {
            throw new AppException(ErrorCode.EDUCATIONAL_UNIT_SIGNATURE_NOT_VERIFIED);
        }

        educationalUnit.setStatus(EducationalUnitStatus.ACTIVE);

        educationalUnitRepository.save(educationalUnit);

        this.sendFeedback(id, "Đơn vị đào tạo của bạn đã được phê duyệt. Bạn có thể đăng nhập và bắt đầu sử dụng hệ thống.");
    }

    public void rejectEducationalUnit(Integer id, String reason){
        EducationalUnit educationalUnit = educationalUnitRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.EDUCATIONAL_UNIT_NOT_FOUND));

        educationalUnit.setStatus(EducationalUnitStatus.REJECTED);

        educationalUnitRepository.save(educationalUnit);

        this.sendFeedback(id, "Đơn vị đào tạo của bạn đã bị từ chối phê duyệt vì lý do sau: \n\n" + reason);
    }

    public void sendFeedback(Integer unitId, String feedback) {
        EducationalUnit entity = educationalUnitRepository.findById(unitId)
                .orElseThrow(() -> new AppException(ErrorCode.EDUCATIONAL_UNIT_NOT_FOUND));

        UserResponse userInfo = userInfoApi.getUserInfo(entity.getIdAdmin()).getResult();

        CompletableFuture<Boolean> future = emailService.sendFeedbackForRegisteredEducationalUnit(userInfo.getEmail(), entity.getName(), feedback);
        future.whenComplete((emailSent, error) -> {
            if (error != null) {
                throw new AppException(ErrorCode.EMAIL_SENDING_FAILED);
            } else if (!emailSent) {
                throw new AppException(ErrorCode.EMAIL_SENDING_FAILED);
            }
        });
    }

    public void sendFeedbackToRepresentative(String email, String name, String feedback) {
        CompletableFuture<Boolean> future = emailService.sendFeedbackForRegisteredEducationalUnit(email, name, feedback);
        future.whenComplete((emailSent, error) -> {
            if (error != null) {
                throw new AppException(ErrorCode.EMAIL_SENDING_FAILED);
            } else if (!emailSent) {
                throw new AppException(ErrorCode.EMAIL_SENDING_FAILED);
            }
        });
    }

    public void suspendEducationalUnit(StatusUpdateRequest request){
        EducationalUnit educationalUnit = educationalUnitRepository.findById(request.getUnitId())
                .orElseThrow(() -> new AppException(ErrorCode.EDUCATIONAL_UNIT_NOT_FOUND));

        educationalUnit.setStatus(EducationalUnitStatus.SUSPENDED);

        educationalUnitRepository.save(educationalUnit);

        this.sendFeedbackToRepresentative(request.getRepresentativeEmail(), request.getUnitName(),
                "Đơn vị đào tạo của bạn đã bị tạm dừng hoạt động.\n\nLý do: " + request.getReason());
    }

    public void reactivateEducationalUnit(StatusUpdateRequest request){
        EducationalUnit educationalUnit = educationalUnitRepository.findById(request.getUnitId())
                .orElseThrow(() -> new AppException(ErrorCode.EDUCATIONAL_UNIT_NOT_FOUND));

        educationalUnit.setStatus(EducationalUnitStatus.ACTIVE);

        educationalUnitRepository.save(educationalUnit);

        this.sendFeedbackToRepresentative(request.getRepresentativeEmail(), request.getUnitName(),
                "Đơn vị đào tạo của bạn đã được kích hoạt lại thành công." +
                        "\n Việc kích hoạt lại có thể do lý do sau: " + request.getReason());
    }

    public String updateStatusEducationalUnit(StatusUpdateRequest request) {

        return switch (request.getStatus().toUpperCase()) {
            case "REACTIVATE" -> {
                this.reactivateEducationalUnit(request);
                yield "Kích hoạt lại đơn vị đào tạo thành công";
            }
            case "SUSPENDED" -> {
                this.suspendEducationalUnit(request);
                yield "Tạm dừng đơn vị đào tạo thành công";
            }
            default -> throw new AppException(ErrorCode.INVALID_REQUEST);
        };

    }
}
