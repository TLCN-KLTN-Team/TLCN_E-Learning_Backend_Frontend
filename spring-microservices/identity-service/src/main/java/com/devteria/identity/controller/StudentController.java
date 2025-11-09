package com.devteria.identity.controller;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import com.devteria.identity.dto.request.ApiResponse;
import com.devteria.identity.dto.request.StudentRequest;
import com.devteria.identity.dto.response.StudentResponse;
import com.devteria.identity.service.StudentService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/students")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class StudentController {

    StudentService studentService;

    @PostMapping
    public ApiResponse<StudentResponse> createStudent(@Valid @RequestBody StudentRequest request) {
        log.info("Creating student with studentId: {}", request.getStudentId());
        return ApiResponse.<StudentResponse>builder()
                .result(studentService.createStudent(request))
                .build();
    }

    @PutMapping("/{id}")
    public ApiResponse<StudentResponse> updateStudent(
            @PathVariable String id, @Valid @RequestBody StudentRequest request) {
        log.info("Updating student with ID: {}", id);
        return ApiResponse.<StudentResponse>builder()
                .result(studentService.updateStudent(id, request))
                .build();
    }

    @GetMapping("/by-user-id/{id}")
    public ApiResponse<StudentResponse> getStudentById(@PathVariable String id) {
        return ApiResponse.<StudentResponse>builder()
                .result(studentService.getStudentById(id)).build();
    }
    @PutMapping("/{id}/status")
    public ApiResponse<StudentResponse> toggleAccountStatus(
            @PathVariable String id,
            @RequestParam String status) {
        log.info("Toggling account status for student ID: {} to {}", id, status);
        return ApiResponse.<StudentResponse>builder()
                .result(studentService.updateAccountStatus(id, status))
                .build();
    }

    @GetMapping("/by-student-id/{studentId}")
    public ApiResponse<StudentResponse> getStudentByStudentId(@PathVariable String studentId) {
        return ApiResponse.<StudentResponse>builder()
                .result(studentService.getStudentByStudentId(studentId))
                .build();
    }

    @GetMapping("/by-educationalUnit/{educationalUnitId}")
    public ApiResponse<Page<StudentResponse>> getStudentsByEducationalUnit(
            @PathVariable int educationalUnitId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("studentId").ascending());

        return ApiResponse.<Page<StudentResponse>>builder()
                .result(studentService.getStudentsByEducationalUnit(educationalUnitId, search, pageable))
                .build();
    }

    @GetMapping("/all-by-educationalUnit/{educationalUnitId}")
    public ApiResponse<List<StudentResponse>> getAllStudentsByEducationalUnit(@PathVariable int educationalUnitId) {

        return ApiResponse.<List<StudentResponse>>builder()
                .result(studentService.getAllStudentsByEducationalUnit(educationalUnitId))
                .build();
    }
}
