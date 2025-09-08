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
        log.info("Creating new teacher with username: {}", request.getUsername());
        validateTeacherRequest(request);

        // Store original password before it gets hashed
        String originalPassword = request.getPassword();

        try {
            log.debug("Calling identity service to create teacher: {}", request);
            ApiResponse<TeacherResponse> response = teacherRepository.createTeacher(request);

            if (response.getResult() == null) {
                log.error("Identity service returned null result for teacher creation: {}", request.getUsername());
                throw new AppException(ErrorCode.TEACHER_VALIDATION_FAILED);
            }

            TeacherResponse teacherResponse = response.getResult();
            log.info("Successfully created teacher with ID: {}", teacherResponse.getId());

            // Send email with credentials asynchronously
            CompletableFuture<Boolean> emailFuture = emailService.sendAccountCredentialsAsync(
                    teacherResponse.getEmail(),
                    teacherResponse.getFirstName(),
                    teacherResponse.getLastName(),
                    teacherResponse.getUsername(),
                    originalPassword,
                    "Teacher"
            );

            // Handle email result asynchronously
            emailFuture.whenComplete((emailSent, emailError) -> {
                if (emailError != null) {
                    log.error("Failed to send account credentials email to teacher {}: {}",
                            teacherResponse.getEmail(), emailError.getMessage(), emailError);
                } else if (emailSent) {
                    log.info("Account credentials email sent successfully to teacher: {}", teacherResponse.getEmail());
                } else {
                    log.warn("Account credentials email sending failed for teacher: {}", teacherResponse.getEmail());
                }
            });

            return teacherResponse;

        } catch (AppException e) {
            log.error("App exception while creating teacher {}: {}", request.getUsername(), e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error creating teacher {}: {}", request.getUsername(), e.getMessage(), e);
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
            throw new IllegalArgumentException("Teacher request cannot be null");
        }

        if (!StringUtils.hasText(request.getUsername())) {
            throw new IllegalArgumentException("Username is required");
        }

        if (!StringUtils.hasText(request.getEmail())) {
            throw new IllegalArgumentException("Email is required");
        }

        if (!StringUtils.hasText(request.getFirstName())) {
            throw new IllegalArgumentException("First name is required");
        }

        if (!StringUtils.hasText(request.getLastName())) {
            throw new IllegalArgumentException("Last name is required");
        }

        if (!StringUtils.hasText(request.getTeacherId())) {
            throw new IllegalArgumentException("Teacher ID is required");
        }

        log.debug("Teacher request validation passed for username: {}", request.getUsername());
    }
}
