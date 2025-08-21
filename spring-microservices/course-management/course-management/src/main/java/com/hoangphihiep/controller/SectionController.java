package com.hoangphihiep.controller;

import com.hoangphihiep.dto.request.CourseRequest;
import com.hoangphihiep.dto.request.SectionRequest;
import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.SectionResponse;
import com.hoangphihiep.service.SectionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/sections")
@RequiredArgsConstructor
@Slf4j
public class SectionController {

    private final SectionService sectionService;

    @PostMapping
    public ResponseEntity<ApiResponse<List<SectionResponse>>> createSections(
            @Valid @RequestBody CourseRequest request) {
        log.info("Creating/updating {} sections for course id: {}",
                request.getSections().size(), request.getId());
        ApiResponse<List<SectionResponse>> response = sectionService.createSections(request);
        return ResponseEntity.ok(response);
    }



    @GetMapping
    public ResponseEntity<ApiResponse<List<SectionResponse>>> getAllSections() {
        log.info("Getting all sections");
        ApiResponse<List<SectionResponse>> response = sectionService.getAllSections();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SectionResponse>> getSectionById(@PathVariable Integer id) {
        log.info("Getting section by id: {}", id);
        ApiResponse<SectionResponse> response = sectionService.getSectionById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<ApiResponse<List<SectionResponse>>> getSectionsByCourseId(
            @PathVariable Integer courseId) {
        log.info("Getting sections by course id: {}", courseId);
        ApiResponse<List<SectionResponse>> response = sectionService.getSectionsByCourseId(courseId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSection(@PathVariable Integer id) {
        log.info("Deleting section with id: {} (cascade delete enabled)", id);
        ApiResponse<Void> response = sectionService.deleteSection(id);
        return ResponseEntity.ok(response);
    }
}
