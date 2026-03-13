package com.hoangphihiep.controller.Expert;

import com.hoangphihiep.dto.request.EquivalentCourseRequest;
import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.EquivalentCourseResponse;
import com.hoangphihiep.service.EquivalentCourseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/expert/equivalent-courses")
@RequiredArgsConstructor
public class EquivalentCourseController {

    private final EquivalentCourseService equivalentCourseService;

    @GetMapping
    public ApiResponse<Page<EquivalentCourseResponse>> getAllEquivalentCourses(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer targetCourseId,
            @PageableDefault(sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {
        return ApiResponse.<Page<EquivalentCourseResponse>>builder()
                .result(equivalentCourseService.getAllEquivalentCourses(keyword, targetCourseId, pageable))
                .build();
    }

    @PostMapping
    public ApiResponse<EquivalentCourseResponse> createEquivalentCourse(@Valid @RequestBody EquivalentCourseRequest request) {
        return ApiResponse.<EquivalentCourseResponse>builder()
                .result(equivalentCourseService.createEquivalentCourse(request))
                .build();
    }

    @PutMapping("/{id}")
    public ApiResponse<EquivalentCourseResponse> updateEquivalentCourse(@PathVariable Integer id, @Valid @RequestBody EquivalentCourseRequest request) {
        return ApiResponse.<EquivalentCourseResponse>builder()
                .result(equivalentCourseService.updateEquivalentCourse(id, request))
                .build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteEquivalentCourse(@PathVariable Integer id) {
        equivalentCourseService.deleteEquivalentCourse(id);
        return ApiResponse.<Void>builder()
                .message("Deleted equivalent course successfully")
                .build();
    }
}
