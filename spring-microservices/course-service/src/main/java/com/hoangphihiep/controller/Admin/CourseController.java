package com.hoangphihiep.controller.Admin;

import com.hoangphihiep.dto.request.CourseRequest;
import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.CourseResponse;
import com.hoangphihiep.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/institutions/{institutionId}")
@RequiredArgsConstructor
@Slf4j
public class CourseController {

    private final CourseService adminCourseService;
    @GetMapping("/courses")
    public ApiResponse<Page<CourseResponse>> getCoursesByInstitution(
            @PathVariable int institutionId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search) {

        log.info("Admin getting courses for institution: {}", institutionId);

        Page<CourseResponse> courses = adminCourseService.getCoursesByInstitution(institutionId, page, size, search);

        return ApiResponse.<Page<CourseResponse>>builder()
                .result(courses)
                .build();
    }

    @PostMapping("/courses")
    public ApiResponse<CourseResponse> createCourse(
            @PathVariable int institutionId,
            @Valid @RequestBody CourseRequest request) {

        log.info("Admin creating course for institution: {}", institutionId);

        CourseResponse response = adminCourseService.createCourseForInstitution(institutionId, request);

        return ApiResponse.<CourseResponse>builder()
                .result(response)
                .build();
    }

    @PutMapping("/courses/{courseId}/assign-teacher")
    public ApiResponse<CourseResponse> assignTeacherToCourse(
            @PathVariable int institutionId,
            @PathVariable int courseId,
            @RequestParam String teacherId) {

        log.info("Admin assigning teacher {} to course {} for institution: {}", teacherId, courseId, institutionId);

        CourseResponse response = adminCourseService.assignTeacherToCourse(courseId, teacherId);

        return ApiResponse.<CourseResponse>builder()
                .result(response)
                .build();
    }

    @PutMapping("/courses/{courseId}/remove-teacher")
    public ApiResponse<CourseResponse> removeTeacherFromCourse(
            @PathVariable int institutionId,
            @PathVariable int courseId) {

        log.info("Admin removing teacher from course {} for institution: {}", courseId, institutionId);

        CourseResponse response = adminCourseService.removeTeacherFromCourse(courseId);

        return ApiResponse.<CourseResponse>builder()
                .result(response)
                .build();
    }
}
