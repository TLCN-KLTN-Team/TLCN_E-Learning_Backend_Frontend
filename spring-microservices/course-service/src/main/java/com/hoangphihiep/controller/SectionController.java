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
@RequestMapping("/sections")
@RequiredArgsConstructor
@Slf4j
public class SectionController {

    private final SectionService sectionService;

    @GetMapping
    public ApiResponse<List<SectionResponse>> getAllSections() {
        return ApiResponse.<List<SectionResponse>>builder()
                .result(sectionService.getAllSections())
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<SectionResponse> getSectionById(@PathVariable Integer id) {
        SectionResponse response = sectionService.getSectionById(id);
        return ApiResponse.<SectionResponse>builder()
                .result(response)
                .build();
    }

    @GetMapping("/course/{courseId}")
    public ApiResponse<List<SectionResponse>> getSectionsByCourseId(@PathVariable Integer courseId) {
        List<SectionResponse> responses = sectionService.getSectionsByCourseId(courseId);
        return ApiResponse.<List<SectionResponse>>builder()
                .result(responses)
                .build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteSection(@PathVariable Integer id) {
        sectionService.deleteSection(id);
        return ApiResponse.<Void>builder()
                .build();
    }
}
