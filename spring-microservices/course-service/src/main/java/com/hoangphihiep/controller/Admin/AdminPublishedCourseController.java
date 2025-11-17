package com.hoangphihiep.controller.Admin;

import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.PublishedCourseResponse;
import com.hoangphihiep.service.PublishedCourseTeacherService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/educational-unit/{educationalUnitId}/published-courses")
@RequiredArgsConstructor
@Slf4j
public class AdminPublishedCourseController {

    private final PublishedCourseTeacherService publishedCourseTeacherService;

    @GetMapping
    public ApiResponse<Page<PublishedCourseResponse>> getAllPublishedCourses(
            @PathVariable Integer educationalUnitId,
            @RequestParam(required = false) Integer status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        log.info("Admin getting all published courses for educational unit: {}, status: {}",
                educationalUnitId, status);

        // Tạo method mới trong service hoặc sử dụng existing method
        Page<PublishedCourseResponse> response = publishedCourseTeacherService
                .getPublishedCoursesForAdmin(educationalUnitId, status, page, size);

        return ApiResponse.<Page<PublishedCourseResponse>>builder()
                .message("Get published courses successfully")
                .result(response)
                .build();
    }

    @GetMapping("/pending")
    public ApiResponse<Page<PublishedCourseResponse>> getPendingCourses(
            @PathVariable Integer educationalUnitId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        log.info("Admin getting pending courses for educational unit: {}", educationalUnitId);
        Page<PublishedCourseResponse> response = publishedCourseTeacherService.getPendingCoursesForAdmin(
                educationalUnitId, page, size);

        return ApiResponse.<Page<PublishedCourseResponse>>builder()
                .message("Get pending courses successfully")
                .result(response)
                .build();
    }

    @PostMapping("/{publishedCourseId}/approve")
    public ApiResponse<PublishedCourseResponse> approveCourse(
            @PathVariable Integer educationalUnitId,
            @PathVariable Integer publishedCourseId) {

        log.info("Admin approving published course ID: {}", publishedCourseId);
        PublishedCourseResponse response = publishedCourseTeacherService.approveCourse(publishedCourseId);

        return ApiResponse.<PublishedCourseResponse>builder()
                .message("Course approved successfully")
                .result(response)
                .build();
    }

    @PostMapping("/{publishedCourseId}/reject")
    public ApiResponse<PublishedCourseResponse> rejectCourse(
            @PathVariable Integer educationalUnitId,
            @PathVariable Integer publishedCourseId,
            @RequestParam String reason) {

        log.info("Admin rejecting published course ID: {} with reason: {}", publishedCourseId, reason);
        PublishedCourseResponse response = publishedCourseTeacherService.rejectCourse(publishedCourseId, reason);

        return ApiResponse.<PublishedCourseResponse>builder()
                .message("Course rejected successfully")
                .result(response)
                .build();
    }

    @GetMapping("/{publishedCourseId}")
    public ApiResponse<PublishedCourseResponse> getPublishedCourseById(
            @PathVariable Integer educationalUnitId,
            @PathVariable Integer publishedCourseId) {

        log.info("Admin getting published course by ID: {}", publishedCourseId);
        PublishedCourseResponse response = publishedCourseTeacherService.getPublishedCourseById(publishedCourseId);

        return ApiResponse.<PublishedCourseResponse>builder()
                .message("Get published course successfully")
                .result(response)
                .build();
    }
}