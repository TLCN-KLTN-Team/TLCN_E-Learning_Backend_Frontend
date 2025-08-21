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
@RequestMapping("/api/v1/courses")
@RequiredArgsConstructor
@Slf4j
public class CourseController {

    private final CourseService courseService;
    @PostMapping
    public ResponseEntity<ApiResponse<CourseResponse>> createCourse(
            @Valid @RequestBody CourseRequest request) {
        log.info("Creating course with name: {}", request.getCourseName());
        ApiResponse<CourseResponse> response = courseService.createCourse(request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CourseResponse>> updateCourse(
            @PathVariable Integer id,
            @Valid @RequestBody CourseRequest request) {
        log.info("Updating course with id: {}", id);
        ApiResponse<CourseResponse> response = courseService.updateCourse(id, request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/detailed")
    public ResponseEntity<ApiResponse<CourseResponse>> updateCourseWithDetails(
            @PathVariable Integer id,
            @Valid @RequestBody CourseRequest request) {
        log.info("Updating course with detailed components for id: {}", id);
        ApiResponse<CourseResponse> response = courseService.updateCourseWithDetails(id, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CourseResponse>>> getAllCourses(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "") String search) {
        log.info("Getting all courses - page: {}, size: {}, search: {}", page, size, search);
        ApiResponse<List<CourseResponse>> response = courseService.getAllCourses(page, size, search);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CourseResponse>> getCourseById(@PathVariable Integer id) {
        log.info("Getting course by id: {}", id);
        ApiResponse<CourseResponse> response = courseService.getCourseById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/teacher/{teacherId}")
    public ResponseEntity<ApiResponse<List<CourseResponse>>> getCoursesByTeacher(
            @PathVariable String teacherId) {
        log.info("Getting courses by teacher: {}", teacherId);
        ApiResponse<List<CourseResponse>> response = courseService.getCoursesByTeacher(teacherId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCourse(@PathVariable Integer id) {
        log.info("Deleting course with id: {}", id);
        ApiResponse<Void> response = courseService.deleteCourse(id);
        return ResponseEntity.ok(response);
    }
}
