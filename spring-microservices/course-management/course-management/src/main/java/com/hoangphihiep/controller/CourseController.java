package com.hoangphihiep.controller;

import com.hoangphihiep.dto.request.CourseRequest;
import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.CourseResponse;
import com.hoangphihiep.service.CourseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/courses")
@RequiredArgsConstructor
@Slf4j
public class CourseController {

    private final CourseService courseService;
    @PostMapping
    public ApiResponse<CourseResponse> createCourse(@Valid @RequestBody CourseRequest request) {
        CourseResponse response = courseService.createCourse(request);

        return ApiResponse.<CourseResponse>builder()
                .result(response)
                .build();
    }

    @PutMapping("/{id}")
    public ApiResponse<CourseResponse> updateCourse(
            @PathVariable Integer id,
            @Valid @RequestBody CourseRequest request) {
        CourseResponse response = courseService.updateCourse(id, request);

        return ApiResponse.<CourseResponse>builder()
                .result(response)
                .build();
    }
    @GetMapping
    public ApiResponse<List<CourseResponse>> getAllCourses(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "") String search) {
        return ApiResponse.<List<CourseResponse>>builder()
                .result(courseService.getAllCourses(page, size, search))
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<CourseResponse> getCourseById(@PathVariable Integer id) {
        return ApiResponse.<CourseResponse>builder()
                .result(courseService.getCourseById(id))
                .build();
    }

    @GetMapping("/teacher/{teacherId}")
    public ApiResponse<List<CourseResponse>> getCoursesByTeacher(@PathVariable String teacherId) {
        return ApiResponse.<List<CourseResponse>>builder()
                .result(courseService.getCoursesByTeacher(teacherId))
                .build();
    }
}
