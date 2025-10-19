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
@RequestMapping("/admin/educationalUnit/{educationalUnitId}")
@RequiredArgsConstructor
@Slf4j
public class StudentController {

    private final CourseService adminCourseService;
    private final StudentService studentService;

    @GetMapping("/students")
    public ApiResponse<Page<StudentResponse>> getStudentsByEducationalUnit(
            @PathVariable int educationalUnitId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search) {

        Page<StudentResponse> students = adminCourseService.getStudentsByEducationalUnit(educationalUnitId, page, size, search);

        return ApiResponse.<Page<StudentResponse>>builder()
                .result(students)
                .build();
    }

    @PostMapping("/students")
    public ApiResponse<StudentResponse> createStudent(
            @PathVariable int educationalUnitId,
            @Valid @RequestBody StudentRequest request) {

        request.setEducationalUnitId(String.valueOf(educationalUnitId));

        StudentResponse response = studentService.createStudent(request);

        return ApiResponse.<StudentResponse>builder()
                .result(response)
                .build();
    }

    @PutMapping("/students/{studentId}")
    public ApiResponse<StudentResponse> updateStudent(
            @PathVariable int educationalUnitId,
            @PathVariable String studentId,
            @Valid @RequestBody StudentRequest request) {

        // Đảm bảo educationalUnitId khớp với institutionId
        request.setEducationalUnitId(String.valueOf(educationalUnitId));

        StudentResponse response = studentService.updateStudent(studentId, request);

        return ApiResponse.<StudentResponse>builder()
                .result(response)
                .build();
    }

    @GetMapping("/students/{studentId}")
    public ApiResponse<StudentResponse> getStudentById(
            @PathVariable int educationalUnitId,
            @PathVariable String studentId) {

        StudentResponse response = studentService.getStudentByStudentId(studentId);

        return ApiResponse.<StudentResponse>builder()
                .result(response)
                .build();
    }
}
