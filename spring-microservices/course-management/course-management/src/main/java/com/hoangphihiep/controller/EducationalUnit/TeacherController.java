package com.hoangphihiep.controller.EducationalUnit;

import com.hoangphihiep.dto.request.TeacherCreateRequest;
import com.hoangphihiep.dto.request.TeacherUpdateRequest;
import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.TeacherResponse;
import com.hoangphihiep.service.TeacherService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/teachers")
@RequiredArgsConstructor
@Slf4j
public class TeacherController {

    private final TeacherService teacherService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TeacherResponse>>> getAllTeachers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search) {

        log.info("REST request to get all teachers with page: {}, size: {}, search: {}", page, size, search);
        ApiResponse<List<TeacherResponse>> response = teacherService.getAllTeachers(page, size, search);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TeacherResponse>> getTeacherById(@PathVariable String id) {
        log.info("REST request to get teacher by id: {}", id);
        ApiResponse<TeacherResponse> response = teacherService.getTeacherById(id);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TeacherResponse>> createTeacher(@Valid @RequestBody TeacherCreateRequest request) {
        log.info("REST request to create teacher with username: {}", request.getUsername());
        ApiResponse<TeacherResponse> response = teacherService.createTeacher(request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TeacherResponse>> updateTeacher(
            @PathVariable String id,
            @Valid @RequestBody TeacherUpdateRequest request) {

        log.info("REST request to update teacher with id: {}", id);
        ApiResponse<TeacherResponse> response = teacherService.updateTeacher(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTeacher(@PathVariable String id) {
        log.info("REST request to delete teacher with id: {}", id);
        ApiResponse<Void> response = teacherService.deleteTeacher(id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/lock")
    public ResponseEntity<ApiResponse<Void>> lockTeacher(@PathVariable String id) {
        log.info("REST request to lock teacher with id: {}", id);
        ApiResponse<Void> response = teacherService.lockTeacher(id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/unlock")
    public ResponseEntity<ApiResponse<Void>> unlockTeacher(@PathVariable String id) {
        log.info("REST request to unlock teacher with id: {}", id);
        ApiResponse<Void> response = teacherService.unlockTeacher(id);
        return ResponseEntity.ok(response);
    }
}

