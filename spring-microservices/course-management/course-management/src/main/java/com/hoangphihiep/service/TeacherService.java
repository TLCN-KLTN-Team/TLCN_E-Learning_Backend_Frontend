package com.hoangphihiep.service;

import com.hoangphihiep.dto.request.TeacherRequest;
import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.SectionResponse;
import com.hoangphihiep.dto.response.TeacherResponse;
import com.hoangphihiep.exception.AppException;
import com.hoangphihiep.exception.ErrorCode;
import com.hoangphihiep.repository.httpclient.TeacherRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
@Slf4j
public class TeacherService {

    private final TeacherRepository teacherRepository;
    private final EmailService emailService;

    public TeacherResponse createTeacher(TeacherRequest request) {
        validateTeacherRequest(request);

        String originalPassword = request.getPassword();

        try {
            ApiResponse<TeacherResponse> response = teacherRepository.createTeacher(request);

            if (response.getResult() == null) {
                throw new AppException(ErrorCode.TEACHER_VALIDATION_FAILED);
            }

            TeacherResponse teacherResponse = response.getResult();

            CompletableFuture<Boolean> emailFuture = emailService.sendAccountCredentialsAsync(
                    teacherResponse.getEmail(),
                    teacherResponse.getFirstName(),
                    teacherResponse.getLastName(),
                    teacherResponse.getUsername(),
                    originalPassword,
                    "Teacher"
            );

            emailFuture.whenComplete((emailSent, emailError) -> {
                if (emailError != null) {
                    log.error("Gửi email thông tin tài khoản cho giáo viên {} thất bại: {}",
                            teacherResponse.getEmail(), emailError.getMessage(), emailError);
                } else if (emailSent) {
                    log.info("Đã gửi email thông tin tài khoản thành công cho giáo viên: {}", teacherResponse.getEmail());
                } else {
                    log.warn("Gửi email thông tin tài khoản cho giáo viên {} không thành công", teacherResponse.getEmail());
                }
            });

            return teacherResponse;

        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            throw new AppException(ErrorCode.TEACHER_VALIDATION_FAILED);
        }
    }

    public TeacherResponse getTeacherByTeacherId(String teacherId) {
        log.info("Getting teacher by teacherId: {}", teacherId);

        ApiResponse<TeacherResponse> response = teacherRepository.getTeacherByTeacherId(teacherId);

        if (response.getResult() == null) {
            throw new RuntimeException("Teacher not found: " + teacherId);
        }

        return response.getResult();
    }

    private void validateTeacherRequest(TeacherRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Yêu cầu tạo giáo viên không được để trống");
        }

        if (!StringUtils.hasText(request.getUsername())) {
            throw new IllegalArgumentException("Tên đăng nhập là bắt buộc");
        }

        if (!StringUtils.hasText(request.getEmail())) {
            throw new IllegalArgumentException("Email là bắt buộc");
        }

        if (!StringUtils.hasText(request.getFirstName())) {
            throw new IllegalArgumentException("Họ của giáo viên là bắt buộc");
        }

        if (!StringUtils.hasText(request.getLastName())) {
            throw new IllegalArgumentException("Tên của giáo viên là bắt buộc");
        }

        if (!StringUtils.hasText(request.getTeacherId())) {
            throw new IllegalArgumentException("Mã giáo viên là bắt buộc");
        }
    }
    public TeacherResponse updateTeacher(String teacherId, TeacherRequest request) {
        log.info("Updating teacher with ID: {}", teacherId);
        validateTeacherRequest(request);

        try {
            log.debug("Calling identity service to update teacher: {}", teacherId);
            ApiResponse<TeacherResponse> response = teacherRepository.updateTeacher(teacherId, request);

            if (response.getResult() == null) {
                log.error("Identity service returned null result for teacher update: {}", teacherId);
                throw new AppException(ErrorCode.TEACHER_VALIDATION_FAILED);
            }

            TeacherResponse teacherResponse = response.getResult();
            log.info("Successfully updated teacher with ID: {}", teacherResponse.getId());

            return teacherResponse;

        } catch (AppException e) {
            log.error("App exception while updating teacher {}: {}", teacherId, e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error updating teacher {}: {}", teacherId, e.getMessage(), e);
            throw new AppException(ErrorCode.TEACHER_VALIDATION_FAILED);
        }
    }
}
