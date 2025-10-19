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
@RequestMapping("/admin/educationalUnit/{educationalUnitId}")
@RequiredArgsConstructor
@Slf4j
public class CourseController {

    private final CourseService adminCourseService;
    @GetMapping("/courses")
    public ApiResponse<Page<CourseResponse>> getCoursesByEducationalUnitId(
            @PathVariable int educationalUnitId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search) {

        Page<CourseResponse> courses = adminCourseService.getCoursesByEducationalUnit(educationalUnitId, page, size, search);

        return ApiResponse.<Page<CourseResponse>>builder()
                .result(courses)
                .build();
    }

    @PostMapping("/courses")
    public ApiResponse<CourseResponse> createCourse(
            @PathVariable int educationalUnitId,
            @Valid @RequestBody CourseRequest request) {

        CourseResponse response = adminCourseService.createCourseForEducationalUnit(educationalUnitId, request);

        return ApiResponse.<CourseResponse>builder()
                .result(response)
                .build();
    }

    @PutMapping("/courses/{courseId}/assign-teacher")
    public ApiResponse<CourseResponse> assignTeacherToCourse(
            @PathVariable int educationalUnitId,
            @PathVariable int courseId,
            @RequestParam String teacherId) {

        CourseResponse response = adminCourseService.assignTeacherToCourse(courseId, teacherId);

        return ApiResponse.<CourseResponse>builder()
                .result(response)
                .build();
    }

    @PutMapping("/courses/{courseId}/remove-teacher")
    public ApiResponse<CourseResponse> removeTeacherFromCourse(
            @PathVariable int educationalUnitId,
            @PathVariable int courseId) {

        CourseResponse response = adminCourseService.removeTeacherFromCourse(courseId);

        return ApiResponse.<CourseResponse>builder()
                .result(response)
                .build();
    }
}
