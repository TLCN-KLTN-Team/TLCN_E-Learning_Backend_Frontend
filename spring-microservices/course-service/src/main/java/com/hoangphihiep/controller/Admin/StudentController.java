package com.hoangphihiep.controller.Admin;

import com.hoangphihiep.dto.request.StudentRequest;
import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.StudentResponse;
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
public class StudentController {

    private final CourseService adminCourseService;
    private final StudentService studentService;

    @GetMapping("/students")
    public ApiResponse<Page<StudentResponse>> getStudentsByInstitution(
            @PathVariable int institutionId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search) {

        log.info("Admin getting students for institution: {}", institutionId);

        Page<StudentResponse> students = adminCourseService.getStudentsByInstitution(institutionId, page, size, search);

        return ApiResponse.<Page<StudentResponse>>builder()
                .result(students)
                .build();
    }

    @PostMapping("/students")
    public ApiResponse<StudentResponse> createStudent(
            @PathVariable int institutionId,
            @Valid @RequestBody StudentRequest request) {

        log.info("Admin creating student for institution: {}", institutionId);

        request.setEducationalUnitId(String.valueOf(institutionId));

        StudentResponse response = studentService.createStudent(request);

        return ApiResponse.<StudentResponse>builder()
                .result(response)
                .build();
    }

    @PutMapping("/students/{studentId}")
    public ApiResponse<StudentResponse> updateStudent(
            @PathVariable int institutionId,
            @PathVariable String studentId,
            @Valid @RequestBody StudentRequest request) {

        log.info("Admin updating student {} for institution: {}", studentId, institutionId);

        // Đảm bảo educationalUnitId khớp với institutionId
        request.setEducationalUnitId(String.valueOf(institutionId));

        StudentResponse response = studentService.updateStudent(studentId, request);

        return ApiResponse.<StudentResponse>builder()
                .result(response)
                .build();
    }

    @GetMapping("/students/{studentId}")
    public ApiResponse<StudentResponse> getStudentById(
            @PathVariable int institutionId,
            @PathVariable String studentId) {

        log.info("Admin getting student {} for institution: {}", studentId, institutionId);

        StudentResponse response = studentService.getStudentByStudentId(studentId);

        return ApiResponse.<StudentResponse>builder()
                .result(response)
                .build();
    }
}
