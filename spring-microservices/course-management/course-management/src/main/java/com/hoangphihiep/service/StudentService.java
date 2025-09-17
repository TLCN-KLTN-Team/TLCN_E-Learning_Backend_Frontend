package com.hoangphihiep.service;

import com.hoangphihiep.dto.request.StudentRequest;
import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.StudentResponse;
import com.hoangphihiep.exception.AppException;
import com.hoangphihiep.exception.ErrorCode;
import com.hoangphihiep.repository.httpclient.StudentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
@Slf4j
public class StudentService {

    private final StudentRepository studentRepository;
    private final EmailService emailService;

    public StudentResponse createStudent(StudentRequest request) {
        log.info("Creating new student with username: {}", request.getUsername());
        validateStudentRequest(request);

        // Store original password before it gets hashed
        String originalPassword = request.getPassword();

        try {
            log.debug("Calling identity service to create student: {}", request);
            ApiResponse<StudentResponse> response = studentRepository.createStudent(request);

            if (response.getResult() == null) {
                log.error("Identity service returned null result for student creation: {}", request.getUsername());
                throw new AppException(ErrorCode.STUDENT_VALIDATION_FAILED);
            }

            StudentResponse studentResponse = response.getResult();
            log.info("Successfully created student with ID: {}", studentResponse.getId());

            // Send email with credentials asynchronously
            CompletableFuture<Boolean> emailFuture = emailService.sendAccountCredentialsAsync(
                    studentResponse.getEmail(),
                    studentResponse.getFirstName(),
                    studentResponse.getLastName(),
                    studentResponse.getUsername(),
                    originalPassword,
                    "Student"
            );

            // Handle email result asynchronously
            emailFuture.whenComplete((emailSent, emailError) -> {
                if (emailError != null) {
                    log.error("Failed to send account credentials email to student {}: {}",
                            studentResponse.getEmail(), emailError.getMessage(), emailError);
                } else if (emailSent) {
                    log.info("Account credentials email sent successfully to student: {}", studentResponse.getEmail());
                } else {
                    log.warn("Account credentials email sending failed for student: {}", studentResponse.getEmail());
                }
            });

            return studentResponse;

        } catch (AppException e) {
            log.error("App exception while creating student {}: {}", request.getUsername(), e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error creating student {}: {}", request.getUsername(), e.getMessage(), e);
            throw new AppException(ErrorCode.STUDENT_VALIDATION_FAILED);
        }
    }

    public StudentResponse getStudentByStudentId(String studentId) {
        log.info("Getting student by studentId: {}", studentId);

        ApiResponse<StudentResponse> response = studentRepository.getStudentByStudentId(studentId);

        if (response.getResult() == null) {
            throw new RuntimeException("Student not found: " + studentId);
        }

        return response.getResult();
    }

    private void validateStudentRequest(StudentRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Student request cannot be null");
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

        if (!StringUtils.hasText(request.getStudentId())) {
            throw new IllegalArgumentException("Student ID is required");
        }

        log.debug("Student request validation passed for username: {}", request.getUsername());
    }

    public StudentResponse updateStudent(String studentId, StudentRequest request) {
        log.info("Updating student with ID: {}", studentId);
        validateStudentRequest(request);

        try {
            log.debug("Calling identity service to update student: {}", studentId);
            ApiResponse<StudentResponse> response = studentRepository.updateStudent(studentId, request);

            if (response.getResult() == null) {
                log.error("Identity service returned null result for student update: {}", studentId);
                throw new AppException(ErrorCode.STUDENT_VALIDATION_FAILED);
            }

            StudentResponse studentResponse = response.getResult();
            log.info("Successfully updated student with ID: {}", studentResponse.getId());

            return studentResponse;

        } catch (AppException e) {
            log.error("App exception while updating student {}: {}", studentId, e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error updating student {}: {}", studentId, e.getMessage(), e);
            throw new AppException(ErrorCode.STUDENT_VALIDATION_FAILED);
        }
    }
}