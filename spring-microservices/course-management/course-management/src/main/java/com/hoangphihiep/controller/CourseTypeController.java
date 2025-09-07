package com.hoangphihiep.controller;

import com.hoangphihiep.dto.request.CourseTypeRequest;
import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.CourseTypeResponse;
import com.hoangphihiep.service.CourseTypeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/course-types")
@RequiredArgsConstructor
@Slf4j
public class CourseTypeController {

    private final CourseTypeService courseTypeService;
    @GetMapping
    public ApiResponse<Page<CourseTypeResponse>> getAllCourseTypes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search) {

        log.info("Admin getting all course types");

//        Page<CourseTypeResponse> courseTypes = courseTypeService.getAllCourseTypes(page, size, search);

        return null;
    }

    @GetMapping("/all")
    public ApiResponse<List<CourseTypeResponse>> getAllCourseTypesForDropdown() {

        log.info("Admin getting all course types for dropdown");

        List<CourseTypeResponse> courseTypes = courseTypeService.getAllCourseTypesForDropdown();

        return ApiResponse.<List<CourseTypeResponse>>builder()
                .result(courseTypes)
                .build();
    }

    // Lấy course type theo ID
    @GetMapping("/{courseTypeId}")
    public ApiResponse<CourseTypeResponse> getCourseTypeById(@PathVariable int courseTypeId) {

        log.info("Admin getting course type by ID: {}", courseTypeId);

        CourseTypeResponse response = courseTypeService.getCourseTypeById(courseTypeId);

        return ApiResponse.<CourseTypeResponse>builder()
                .result(response)
                .build();
    }
}