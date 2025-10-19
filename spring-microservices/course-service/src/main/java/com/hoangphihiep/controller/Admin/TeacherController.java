package com.hoangphihiep.controller.Admin;

import com.hoangphihiep.dto.request.TeacherRequest;
import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.TeacherResponse;
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
public class TeacherController {

    private final CourseService adminCourseService;
    private final TeacherService teacherService;

    @GetMapping("/teachers")
    public ApiResponse<Page<TeacherResponse>> getTeachersByEducationalUnit(
            @PathVariable int educationalUnitId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search) {


        Page<TeacherResponse> teachers = adminCourseService.getTeachersByEducationalUnit(educationalUnitId, page, size, search);

        return ApiResponse.<Page<TeacherResponse>>builder()
                .result(teachers)
                .build();
    }

    @PostMapping("/teachers")
    public ApiResponse<TeacherResponse> createTeacher(
            @PathVariable int educationalUnitId,
            @Valid @RequestBody TeacherRequest request) {

        request.setEducationalUnitId(String.valueOf(educationalUnitId));

        TeacherResponse response = teacherService.createTeacher(request);

        return ApiResponse.<TeacherResponse>builder()
                .result(response)
                .build();
    }

    @GetMapping("/teachers/{teacherId}")
    public ApiResponse<TeacherResponse> getTeacherById(
            @PathVariable int educationalUnitId,
            @PathVariable String teacherId) {

        TeacherResponse response = teacherService.getTeacherByTeacherId(teacherId);

        return ApiResponse.<TeacherResponse>builder()
                .result(response)
                .build();
    }
    @PutMapping("/teachers/{teacherId}")
    public ApiResponse<TeacherResponse> updateTeacher(
            @PathVariable int educationalUnitId,
            @PathVariable String teacherId,
            @Valid @RequestBody TeacherRequest request) {

        request.setEducationalUnitId(String.valueOf(educationalUnitId));

        TeacherResponse response = teacherService.updateTeacher(teacherId, request);

        return ApiResponse.<TeacherResponse>builder()
                .result(response)
                .build();
    }
}
