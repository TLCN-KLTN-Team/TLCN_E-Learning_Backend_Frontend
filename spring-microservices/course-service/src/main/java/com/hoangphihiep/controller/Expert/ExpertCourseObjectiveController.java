package com.hoangphihiep.controller.Expert;

import com.hoangphihiep.dto.request.CourseObjectiveRequest;
import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.CourseObjectiveResponse;
import com.hoangphihiep.service.CourseObjectiveService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/expert/educational-unit/{educationalUnitId}/courses/{courseId}/clos")
@RequiredArgsConstructor
@Slf4j
public class ExpertCourseObjectiveController {

    private final CourseObjectiveService courseObjectiveService;

    @GetMapping
    public ApiResponse<List<CourseObjectiveResponse>> getCourseObjectives(
            @PathVariable Integer educationalUnitId,
            @PathVariable Integer courseId) {

        List<CourseObjectiveResponse> responses = courseObjectiveService.getCourseObjectivesByCourseId(courseId);

        return ApiResponse.<List<CourseObjectiveResponse>>builder()
                .result(responses)
                .build();
    }

    @PostMapping
    public ApiResponse<CourseObjectiveResponse> createCourseObjective(
            @PathVariable Integer educationalUnitId,
            @PathVariable Integer courseId,
            @Valid @RequestBody CourseObjectiveRequest request) {

        CourseObjectiveResponse objective = courseObjectiveService.createCourseObjective(
                courseId,
                request.getCode(),
                request.getDescription()
        );

        return ApiResponse.<CourseObjectiveResponse>builder()
                .result(objective)
                .build();
    }

    @PutMapping("/{cloId}")
    public ApiResponse<CourseObjectiveResponse> updateCourseObjective(
            @PathVariable Integer educationalUnitId,
            @PathVariable Integer courseId,
            @PathVariable Integer cloId,
            @Valid @RequestBody CourseObjectiveRequest request) {

        CourseObjectiveResponse objective = courseObjectiveService.updateCourseObjective(
                cloId,
                request.getCode(),
                request.getDescription()
        );

        return ApiResponse.<CourseObjectiveResponse>builder()
                .result(objective)
                .build();
    }

    @PutMapping("/{cloId}/deactivate")
    public ApiResponse<Void> deactivateCourseObjective(
            @PathVariable Integer educationalUnitId,
            @PathVariable Integer courseId,
            @PathVariable Integer cloId) {

        courseObjectiveService.deactivateCourseObjective(cloId);

        return ApiResponse.<Void>builder()
                .message("CLO deactivated successfully")
                .build();
    }

    @PutMapping("/{cloId}/reactivate")
    public ApiResponse<Void> reactivateCourseObjective(
            @PathVariable Integer educationalUnitId,
            @PathVariable Integer courseId,
            @PathVariable Integer cloId) {

        courseObjectiveService.reactivateCourseObjective(cloId);

        return ApiResponse.<Void>builder()
                .message("CLO reactivated successfully")
                .build();
    }
}
