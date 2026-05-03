package com.hoangphihiep.controller.student;

import com.hoangphihiep.dto.request.MarkLessonCompleteRequest;
import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.CourseProgressDetailResponse;
import com.hoangphihiep.dto.response.ProgressStatsResponse;
import com.hoangphihiep.service.ProgressService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/student/progress")
@RequiredArgsConstructor
public class ProgressController {

    private final ProgressService progressService;

    @GetMapping("/class/{classId}/stats")
    public ApiResponse<ProgressStatsResponse> getClassProgressStats(
            @PathVariable Integer classId) {
        return ApiResponse.<ProgressStatsResponse>builder()
                .result(progressService.getClassProgressStats(classId))
                .build();
    }

    @GetMapping("/class/{classId}/detail")
    public ApiResponse<CourseProgressDetailResponse> getCourseProgressDetail(
            @PathVariable Integer classId) {
        CourseProgressDetailResponse result =
                progressService.getCourseProgressDetail(classId);

        System.out.println ("CourseProgressDetailResponse for classId {}: {}" +
                classId + result);

        return ApiResponse.<CourseProgressDetailResponse>builder()
                .result(result)
                .build();
    }

    @PostMapping("/lesson/complete")
    public ApiResponse<CourseProgressDetailResponse> markLessonComplete(
            @RequestBody MarkLessonCompleteRequest request) {
        return ApiResponse.<CourseProgressDetailResponse>builder()
                .result(progressService.markLessonComplete(request))
                .build();
    }
}