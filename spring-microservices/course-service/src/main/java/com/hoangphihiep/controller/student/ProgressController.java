package com.hoangphihiep.controller.student;

import com.hoangphihiep.dto.request.MarkLessonCompleteRequest;
import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.CourseProgressResponse;
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
    public ApiResponse<CourseProgressResponse> getCourseProgressDetail(
            @PathVariable Integer classId) {
        CourseProgressResponse result =
                progressService.getCourseProgressDetail(classId);

        System.out.println ("CourseProgressResponse for classId {}: {}" +
                classId + result);

        return ApiResponse.<CourseProgressResponse>builder()
                .result(result)
                .build();
    }

    @PostMapping("/lesson/complete")
    public ApiResponse<CourseProgressResponse> markLessonComplete(
            @RequestBody MarkLessonCompleteRequest request) {
        return ApiResponse.<CourseProgressResponse>builder()
                .result(progressService.markLessonComplete(request))
                .build();
    }
}