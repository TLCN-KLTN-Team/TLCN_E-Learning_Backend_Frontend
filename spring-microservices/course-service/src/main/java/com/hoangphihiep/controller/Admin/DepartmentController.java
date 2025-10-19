package com.hoangphihiep.controller.Admin;

import com.hoangphihiep.dto.request.DepartmentRequest;
import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.DepartmentResponse;
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
public class DepartmentController {

    private final CourseService adminCourseService;

    @GetMapping("/departments")
    public ApiResponse<Page<DepartmentResponse>> getDepartmentsByEducationalUnit(
            @PathVariable int educationalUnitId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search) {

        Page<DepartmentResponse> departments = adminCourseService.getDepartmentsByEducationalUnit(educationalUnitId, page, size, search);

        return ApiResponse.<Page<DepartmentResponse>>builder()
                .result(departments)
                .build();
    }

    @PostMapping("/departments")
    public ApiResponse<DepartmentResponse> createDepartment(
            @PathVariable int educationalUnitId,
            @Valid @RequestBody DepartmentRequest request) {

        DepartmentResponse response = adminCourseService.createDepartmentForEducationalUnit(educationalUnitId, request);

        return ApiResponse.<DepartmentResponse>builder()
                .result(response)
                .build();
    }

    @PutMapping("/departments/{departmentId}")
    public ApiResponse<DepartmentResponse> updateDepartment(
            @PathVariable int educationalUnitId,
            @PathVariable int departmentId,
            @Valid @RequestBody DepartmentRequest request) {

        DepartmentResponse response = adminCourseService.updateDepartmentForEducationalUnit(educationalUnitId, departmentId, request);

        return ApiResponse.<DepartmentResponse>builder()
                .result(response)
                .build();
    }

    @GetMapping("/departments/{departmentId}")
    public ApiResponse<DepartmentResponse> getDepartmentById(
            @PathVariable int educationalUnitId,
            @PathVariable int departmentId) {

        DepartmentResponse response = adminCourseService.getDepartmentByIdForEducationalUnit(educationalUnitId, departmentId);

        return ApiResponse.<DepartmentResponse>builder()
                .result(response)
                .build();
    }
}
