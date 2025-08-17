package com.hoangphihiep.service;

import com.hoangphihiep.client.IdentityServiceClient;
import com.hoangphihiep.dto.request.TeacherCreateRequest;
import com.hoangphihiep.dto.request.TeacherUpdateRequest;
import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.TeacherResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class TeacherService {

    private final IdentityServiceClient identityServiceClient;

    public ApiResponse<List<TeacherResponse>> getAllTeachers(int page, int size, String search) {
        log.info("Getting all teachers with page: {}, size: {}, search: {}", page, size, search);
        return identityServiceClient.getAllTeachers(page, size, search);
    }

    public ApiResponse<TeacherResponse> getTeacherById(String id) {
        log.info("Getting teacher by id: {}", id);
        return identityServiceClient.getTeacherById(id);
    }

    public ApiResponse<TeacherResponse> createTeacher(TeacherCreateRequest request) {
        log.info("Creating new teacher with username: {}", request.getUsername());
        return identityServiceClient.createTeacher(request);
    }

    public ApiResponse<TeacherResponse> updateTeacher(String id, TeacherUpdateRequest request) {
        log.info("Updating teacher with id: {}", id);
        return identityServiceClient.updateTeacher(id, request);
    }

    public ApiResponse<Void> deleteTeacher(String id) {
        log.info("Deleting teacher with id: {}", id);
        return identityServiceClient.deleteTeacher(id);
    }

    public ApiResponse<Void> lockTeacher(String id) {
        log.info("Locking teacher with id: {}", id);
        return identityServiceClient.lockTeacher(id);
    }

    public ApiResponse<Void> unlockTeacher(String id) {
        log.info("Unlocking teacher with id: {}", id);
        return identityServiceClient.unlockTeacher(id);
    }
}
