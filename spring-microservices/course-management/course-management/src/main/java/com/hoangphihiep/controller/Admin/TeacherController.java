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
@RequestMapping("/admin/institutions/{institutionId}")
@RequiredArgsConstructor
@Slf4j
public class TeacherController {

    private final CourseService adminCourseService;
    private final TeacherService teacherService;

    @GetMapping("/teachers")
    public ApiResponse<Page<TeacherResponse>> getTeachersByInstitution(
            @PathVariable int institutionId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search) {

        log.info("Admin getting teachers for institution: {}", institutionId);

        Page<TeacherResponse> teachers = adminCourseService.getTeachersByInstitution(institutionId, page, size, search);

        return ApiResponse.<Page<TeacherResponse>>builder()
                .result(teachers)
                .build();
    }

    @PostMapping("/teachers")
    public ApiResponse<TeacherResponse> createTeacher(
            @PathVariable int institutionId,
            @Valid @RequestBody TeacherRequest request) {

        log.info("Admin creating teacher for institution: {}", institutionId);

        request.setEducationalUnitId(String.valueOf(institutionId));

        TeacherResponse response = teacherService.createTeacher(request);

        return ApiResponse.<TeacherResponse>builder()
                .result(response)
                .build();
    }

    @GetMapping("/teachers/{teacherId}")
    public ApiResponse<TeacherResponse> getTeacherById(
            @PathVariable int institutionId,
            @PathVariable String teacherId) {

        log.info("Admin getting teacher {} for institution: {}", teacherId, institutionId);

        TeacherResponse response = teacherService.getTeacherByTeacherId(teacherId);

        return ApiResponse.<TeacherResponse>builder()
                .result(response)
                .build();
    }
    @PutMapping("/teachers/{teacherId}")
    public ApiResponse<TeacherResponse> updateTeacher(
            @PathVariable int institutionId,
            @PathVariable String teacherId,
            @Valid @RequestBody TeacherRequest request) {

        log.info("Admin updating teacher {} for institution: {}", teacherId, institutionId);

        // Đảm bảo educationalUnitId khớp với institutionId
        request.setEducationalUnitId(String.valueOf(institutionId));

        TeacherResponse response = teacherService.updateTeacher(teacherId, request);

        return ApiResponse.<TeacherResponse>builder()
                .result(response)
                .build();
    }
}
