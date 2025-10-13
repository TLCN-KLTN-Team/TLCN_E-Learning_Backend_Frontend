package com.devteria.identity.controller;

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
    @GetMapping("/by-institution/{institutionId}")
    public ApiResponse<Page<TeacherResponse>> getTeachersByInstitution(
            @PathVariable int institutionId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search) {

        log.info("Getting teachers for institution: {} with search: {}", institutionId, search);

        Pageable pageable = PageRequest.of(page, size, Sort.by("teacherId").ascending());

        return ApiResponse.<Page<TeacherResponse>>builder()
                .result(teacherService.getTeachersByInstitution(institutionId, search, pageable))
                .build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteTeacher(@PathVariable String id) {
        log.info("Deleting teacher with ID: {}", id);
        teacherService.deleteTeacher(id);
        return ApiResponse.<Void>builder().build();
    }
}
