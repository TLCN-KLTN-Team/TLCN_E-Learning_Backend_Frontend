package com.hoangphihiep.controller.SystemAdmin;

import com.hoangphihiep.dto.request.CourseTypeRequest;
import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.CourseTypeResponse;
import com.hoangphihiep.dto.response.PaginatedResponse;
import com.hoangphihiep.service.CourseTypeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/super-admin/course-categories")
@RequiredArgsConstructor
public class CourseTypesController {
    private final CourseTypeService courseTypeService;

    @GetMapping
    public ApiResponse<PaginatedResponse<CourseTypeResponse>> getAllCourseTypes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        PaginatedResponse<CourseTypeResponse> response = courseTypeService.getAllCourseTypes(page, size);
        return ApiResponse.success(
                response,
                "Fetched course types successfully"
        );
    }

    @PostMapping("/create")
    public ApiResponse<CourseTypeResponse> createCourseType(
            @Valid @RequestBody CourseTypeRequest request
    ) {
        CourseTypeResponse response = courseTypeService.createCourseType(request);
        return ApiResponse.success(
                response,
                "Created course type successfully"
        );
    }

    @PutMapping("/{id}/update")
    public ApiResponse<CourseTypeResponse> updateCourseType(
            @PathVariable Integer id,
            @RequestBody CourseTypeRequest request
    ) {
        CourseTypeResponse response = courseTypeService.updateCourseType(id, request);
        return ApiResponse.success(
                response,
                "Updated course type successfully"
        );
    }

    @PutMapping("/{id}/disable")
    public ApiResponse<String> deleteCourseType(
            @PathVariable Integer id
    ) {
        courseTypeService.disableCourseType(id);
        return ApiResponse.success(
                null,
                "Disable course type successfully"
        );
    }
}
