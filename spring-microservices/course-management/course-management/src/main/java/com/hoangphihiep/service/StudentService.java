package com.hoangphihiep.service;

import com.hoangphihiep.dto.request.StudentRequest;
import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.StudentResponse;
import com.hoangphihiep.repository.httpclient.StudentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
@Slf4j
public class StudentService {

    private final StudentRepository studentRepository;

    public StudentResponse createStudent(StudentRequest request) {
        log.info("Creating new student with username: {}", request.getUsername());

        validateStudentRequest(request);

        log.debug("Calling identity service to create student: {}", request);
        ApiResponse<StudentResponse> response = studentRepository.createStudent(request);

        if (response.getResult() == null) {
            throw new RuntimeException("Failed to create student: " + request.getUsername());
        }

        log.info("Successfully created student with ID: {}", response.getResult().getId());
        return response.getResult();
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
}