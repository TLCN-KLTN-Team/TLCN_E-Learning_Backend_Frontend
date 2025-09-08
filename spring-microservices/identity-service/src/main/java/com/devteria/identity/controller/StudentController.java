package com.devteria.identity.controller;

import com.devteria.identity.dto.request.ApiResponse;
import com.devteria.identity.dto.request.StudentRequest;
import com.devteria.identity.dto.response.StudentResponse;
import com.devteria.identity.service.StudentService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    @GetMapping("/by-student-id/{studentId}")
    public ApiResponse<StudentResponse> getStudentByStudentId(@PathVariable String studentId) {
        log.info("Getting student by studentId: {}", studentId);
        return ApiResponse.<StudentResponse>builder()
                .result(studentService.getStudentByStudentId(studentId))
                .build();
    }

    @GetMapping("/by-institution/{institutionId}")
    public ApiResponse<Page<StudentResponse>> getStudentsByInstitution(
            @PathVariable int institutionId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search) {

        log.info("Getting students for institution: {} with search: {}", institutionId, search);

        Pageable pageable = PageRequest.of(page, size, Sort.by("studentId").ascending());

        return ApiResponse.<Page<StudentResponse>>builder()
                .result(studentService.getStudentsByInstitution(institutionId, search, pageable))
                .build();
    }

    @GetMapping("/all-by-institution/{institutionId}")
    public ApiResponse<List<StudentResponse>> getAllStudentsByInstitution(@PathVariable int institutionId) {
        log.info("Getting all students for institution: {}", institutionId);

        return ApiResponse.<List<StudentResponse>>builder()
                .result(studentService.getAllStudentsByInstitution(institutionId))
                .build();
    }
}