package com.hoangphihiep.service;

import com.hoangphihiep.dto.request.ExpertRequest;
import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.ExpertResponse;
import com.hoangphihiep.dto.response.EducationalUnitResponse;
import com.hoangphihiep.exception.AppException;
import com.hoangphihiep.exception.ErrorCode;
import com.hoangphihiep.repository.EducationalUnitRepository;
import com.hoangphihiep.repository.httpclient.ExpertRepository;
import com.hoangphihiep.entity.EducationalUnit;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExpertService {

    private final ExpertRepository expertRepository;
    private final EmailService emailService;
    private final EducationalUnitRepository educationalUnitRepository;

    public ExpertResponse createExpert(ExpertRequest request) {
        validateExpertRequest(request);

        String originalPassword = request.getPassword();

        try {
            ApiResponse<ExpertResponse> response = expertRepository.createExpert(request);

            if (response.getResult() == null) {
                // Assuming generic validation error if result is null
                throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
            }

            ExpertResponse expertResponse = response.getResult();

            CompletableFuture<Boolean> emailFuture = emailService.sendAccountCredentialsAsync(
                    expertResponse.getEmail(),
                    expertResponse.getFirstName(),
                    expertResponse.getLastName(),
                    expertResponse.getUsername(),
                    originalPassword,
                    "Expert"
            );

            emailFuture.whenComplete((emailSent, emailError) -> {
                if (emailError != null) {
                    log.error("Gửi email thông tin tài khoản cho chuyên gia {} thất bại: {}",
                            expertResponse.getEmail(), emailError.getMessage(), emailError);
                } else if (emailSent) {
                    log.info("Đã gửi email thông tin tài khoản thành công cho chuyên gia: {}", expertResponse.getEmail());
                } else {
                    log.warn("Gửi email thông tin tài khoản cho chuyên gia {} không thành công", expertResponse.getEmail());
                }
            });

            return expertResponse;

        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    public ExpertResponse getExpertByExpertId(String expertId) {
        log.info("Getting expert by expertId: {}", expertId);

        ApiResponse<ExpertResponse> response = expertRepository.getExpertByExpertId(expertId);

        if (response.getResult() == null) {
            throw new RuntimeException("Expert not found: " + expertId);
        }

        return response.getResult();
    }

    private void validateExpertRequest(ExpertRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Yêu cầu tạo chuyên gia không được để trống");
        }

        if (!StringUtils.hasText(request.getUsername())) {
            throw new IllegalArgumentException("Tên đăng nhập là bắt buộc");
        }

        if (!StringUtils.hasText(request.getEmail())) {
            throw new IllegalArgumentException("Email là bắt buộc");
        }

        if (!StringUtils.hasText(request.getFirstName())) {
            throw new IllegalArgumentException("Họ của chuyên gia là bắt buộc");
        }

        if (!StringUtils.hasText(request.getLastName())) {
            throw new IllegalArgumentException("Tên của chuyên gia là bắt buộc");
        }

        if (!StringUtils.hasText(request.getExpertId())) {
            throw new IllegalArgumentException("Mã chuyên gia là bắt buộc");
        }
    }

    public ExpertResponse updateExpert(String expertId, ExpertRequest request) {
        log.info("Updating expert with ID: {}", expertId);
        validateExpertRequest(request);

        try {
            // Need the internal ID (UUID) to update, but usually we pass the identifier to the service
            // and the service finds the ID. But Repo expects ID. 
            // TeacherService.updateTeacher takes `teacherId` (string identifier like T001) but calls `teacherRepository.updateTeacher(teacherId, request)`.
            // Wait, TeacherController in IdentityService `updateTeacher(@PathVariable String id ...)` takes UUID.
            // TeacherService in CourseService `updateTeacher(String teacherId, ...)` calls `teacherRepository.updateTeacher(teacherId, ...)`
            // This implies `teacherId` passed to CourseService is actually the UUID? Or IdentityService handles looking up by `teacherId` in update?
            // IdentityService TeacherController `updateTeacher(@PathVariable String id)` -> `teacherService.updateTeacher(id, request)`.
            // IdentityService TeacherService `updateTeacher(String id, ...)` -> `teacherRepository.findById(id)`.
            // So `updateTeacher` expects UUID.
            // But CourseService `getTeacherById` passes `teacherId` (T001) to `getTeacherByTeacherId`.
            // Check TeacherController in CourseService again. 
            // `getTeacherById(@PathVariable String teacherId)` -> calls `teacherService.getTeacherByTeacherId(teacherId)`.
            // `updateTeacher(@PathVariable String teacherId)` -> calls `teacherService.updateTeacher(teacherId, request)`.
            // So CourseService seems to use `teacherId` (T001) as the identifier.
            // BUT `teacherRepository.updateTeacher` in CourseService definition calls `PUT /teachers/{id}`.
            // If `{id}` is UUID, then we are sending T001 as UUID? That would fail.
            // Unless `teacherId` in CourseService Controller refers to the UUID?
            // Frontend: `handleEditTeacher` passes `teacher.id` (which is UUID from response).
            // So `teacherId` in CourseService Controller path variable is actually UUID.
            
            ApiResponse<ExpertResponse> response = expertRepository.updateExpert(expertId, request);

            if (response.getResult() == null) {
                throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
            }

            return response.getResult();

        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    public ExpertResponse updateExpertAccountStatus(String expertId, String status) {
        log.info("Updating account status for expert ID: {} to {}", expertId, status);

        try {
            ApiResponse<ExpertResponse> response = expertRepository.updateExpertAccountStatus(expertId, status);

            if (response.getResult() == null) {
                throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
            }

            return response.getResult();

        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }
    public com.hoangphihiep.dto.response.ExpertImportResponse bulkImportExperts(int educationalUnitId, java.util.List<ExpertRequest> experts) {
        java.util.List<com.hoangphihiep.dto.response.ExpertImportResponse.ImportResultDetail> results = new java.util.ArrayList<>();
        int successful = 0;
        int failed = 0;

        for (ExpertRequest expert : experts) {
            try {
                expert.setEducationalUnitId(String.valueOf(educationalUnitId));
                ExpertResponse response = createExpert(expert);

                results.add(com.hoangphihiep.dto.response.ExpertImportResponse.ImportResultDetail.builder()
                        .username(expert.getUsername())
                        .success(true)
                        .message("Tạo chuyên gia thành công")
                        .build());
                successful++;

            } catch (Exception e) {
                log.error("Failed to import expert {}: {}", expert.getUsername(), e.getMessage());

                String errorMessage = e.getMessage();
                if (e instanceof AppException) {
                    AppException appEx = (AppException) e;
                    errorMessage = appEx.getErrorCode().getMessage();
                }

                results.add(com.hoangphihiep.dto.response.ExpertImportResponse.ImportResultDetail.builder()
                        .username(expert.getUsername())
                        .success(false)
                        .message(errorMessage != null ? errorMessage : "Lỗi không xác định")
                        .build());
                failed++;
            }
        }

        log.info("Bulk import completed: {} successful, {} failed", successful, failed);

        return com.hoangphihiep.dto.response.ExpertImportResponse.builder()
                .successful(successful)
                .failed(failed)
                .results(results)
                .build();
    }
}
