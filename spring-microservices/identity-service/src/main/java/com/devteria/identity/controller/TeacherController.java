package com.devteria.identity.controller;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import com.devteria.identity.dto.request.ApiResponse;
import com.devteria.identity.dto.request.TeacherRequest;
import com.devteria.identity.dto.response.TeacherResponse;
import com.devteria.identity.service.TeacherService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/teachers")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class TeacherController {

    TeacherService teacherService;

    @PostMapping
    public ApiResponse<TeacherResponse> createTeacher(@Valid @RequestBody TeacherRequest request) {
        log.info("Creating teacher with teacherId: {}", request.getTeacherId());
        return ApiResponse.<TeacherResponse>builder()
                .result(teacherService.createTeacher(request))
                .build();
    }

    @PutMapping("/{id}")
    public ApiResponse<TeacherResponse> updateTeacher(
            @PathVariable String id, @Valid @RequestBody TeacherRequest request) {
        log.info("Updating teacher with ID: {}", id);
        return ApiResponse.<TeacherResponse>builder()
                .result(teacherService.updateTeacher(id, request))
                .build();
    }

    @PutMapping("/{id}/status")
    public ApiResponse<TeacherResponse> toggleAccountStatus(@PathVariable String id, @RequestParam String status) {
        log.info("Toggling account status for student ID: {} to {}", id, status);
        return ApiResponse.<TeacherResponse>builder()
                .result(teacherService.updateAccountStatus(id, status))
                .build();
    }

    @GetMapping
    public ApiResponse<Page<TeacherResponse>> getAllTeachers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "teacherId") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir,
            @RequestParam(required = false) String teacherId,
            @RequestParam(required = false) String departmentId,
            @RequestParam(required = false) String educationalUnitId) {

        log.info("Getting teachers - page: {}, size: {}, sortBy: {}, sortDir: {}", page, size, sortBy, sortDir);

        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        return ApiResponse.<Page<TeacherResponse>>builder()
                .result(teacherService.getAllTeachers(teacherId, departmentId, educationalUnitId, pageable))
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<TeacherResponse> getTeacherById(@PathVariable String id) {
        log.info("Getting teacher by ID: {}", id);
        return ApiResponse.<TeacherResponse>builder()
                .result(teacherService.getTeacherById(id))
                .build();
    }

    @GetMapping("/by-teacher-id/{teacherId}")
    public ApiResponse<TeacherResponse> getTeacherByTeacherId(@PathVariable String teacherId) {
        log.info("Getting teacher by teacherId: {}", teacherId);
        return ApiResponse.<TeacherResponse>builder()
                .result(teacherService.getTeacherByTeacherId(teacherId))
                .build();
    }

    // Thêm endpoint mới cho admin
    @GetMapping("/by-educationalUnit/{educationalUnitId}")
    public ApiResponse<Page<TeacherResponse>> getTeachersByEducationalUnit(
            @PathVariable int educationalUnitId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("teacherId").ascending());

        return ApiResponse.<Page<TeacherResponse>>builder()
                .result(teacherService.getTeachersByEducationalUnit(educationalUnitId, search, pageable))
                .build();
    }

    @GetMapping("/educational-units/{educationalUnitId}")
    public ApiResponse<List<TeacherResponse>> getTeachersByEducationalUnitNoPage(@PathVariable int educationalUnitId) {

        return ApiResponse.<List<TeacherResponse>>builder()
                .result(teacherService.getTeachersByEducationalUnitId(educationalUnitId))
                .build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteTeacher(@PathVariable String id) {
        log.info("Deleting teacher with ID: {}", id);
        teacherService.deleteTeacher(id);
        return ApiResponse.<Void>builder().build();
    }

    @GetMapping("/by-user-id/{userId}")
    public ApiResponse<TeacherResponse> getTeacherByUserId(@PathVariable String userId) {
        log.info("Getting teacher by userId: {}", userId);
        return ApiResponse.<TeacherResponse>builder()
                .result(teacherService.getTeacherByUserId(userId))
                .build();
    }

    @GetMapping("/count-by-educational-unit/{educationalUnitId}")
    public ApiResponse<Long> countTeachersByEducationalUnit(@PathVariable Integer educationalUnitId) {
        log.info("Counting teachers for educational unit: {}", educationalUnitId);
        return ApiResponse.<Long>builder()
                .result(teacherService.countByEducationalUnit(educationalUnitId))
                .build();
    }
}
