package com.hoangphihiep.service;

import com.hoangphihiep.dto.request.TeacherRequest;
import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.SectionResponse;
import com.hoangphihiep.dto.response.TeacherResponse;
import com.hoangphihiep.repository.httpclient.TeacherRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class TeacherService {

    private final TeacherRepository teacherRepository;

    public ApiResponse<List<TeacherResponse>> getAllTeachers(int page, int size, String search) {
        log.info("Getting all teachers with page: {}, size: {}, search: {}", page, size, search);
        return null;
    }

    public ApiResponse<TeacherResponse> getTeacherById(String id) {
        log.info("Getting teacher by id: {}", id);
        return null;
    }

    public ApiResponse<TeacherResponse> createTeacher(TeacherRequest request) {
        log.info("Creating new teacher with username: {}", request.getUsername());

        // Validate request
        validateTeacherRequest(request);

        try {
            log.debug("Calling identity service to create teacher: {}", request);
            ApiResponse<TeacherResponse> response = teacherRepository.createTeacher(request);

            log.info("Successfully created teacher with ID: {}",
                    response.getResult() != null ? response.getResult().getId() : "unknown");

            return ApiResponse.<TeacherResponse>builder()
                    .code(response.getCode())
                    .message("Create teacher successfully")
                    .result(response.getResult())
                    .build();

        } catch (Exception e) {
            log.error("Failed to create teacher with username: {}", request.getUsername(), e);
            throw e;
        }
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

        // Add more validation as needed
        log.debug("Teacher request validation passed for username: {}", request.getUsername());
    }

    public ApiResponse<TeacherResponse> updateTeacher(String id, TeacherRequest request) {
        log.info("Updating teacher with id: {}", id);
        return null;
    }

    public ApiResponse<Void> deleteTeacher(String id) {
        log.info("Deleting teacher with id: {}", id);
        return null;
    }

    public ApiResponse<Void> lockTeacher(String id) {
        log.info("Locking teacher with id: {}", id);
        return null;
    }

    public ApiResponse<Void> unlockTeacher(String id) {
        log.info("Unlocking teacher with id: {}", id);
        return null;
    }
}
