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

    public TeacherResponse createTeacher(TeacherRequest request) {
        log.info("Creating new teacher with username: {}", request.getUsername());
        validateTeacherRequest(request);

        log.debug("Calling identity service to create teacher: {}", request);
        ApiResponse<TeacherResponse> response = teacherRepository.createTeacher(request);

        if (response.getResult() == null) {
            throw new RuntimeException("Failed to create teacher: " + request.getUsername());
        }

        log.info("Successfully created teacher with ID: {}", response.getResult().getId());
        return response.getResult();
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
