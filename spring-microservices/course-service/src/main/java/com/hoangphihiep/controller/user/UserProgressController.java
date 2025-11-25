package com.hoangphihiep.controller.user;

import com.hoangphihiep.dto.request.MarkLessonCompleteRequest;
import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.CourseProgressDetailResponse;
import com.hoangphihiep.dto.response.ProgressStatsResponse;
import com.hoangphihiep.service.UserProgressService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/user/progress")
@RequiredArgsConstructor
@Slf4j
public class UserProgressController {

    private final UserProgressService userProgressService;

    @GetMapping("/published-course/{publishedCourseId}/stats")
    public ApiResponse<ProgressStatsResponse> getPublishedCourseProgressStats(
            @PathVariable Integer publishedCourseId) {
        log.info("Getting progress stats for published course: {}", publishedCourseId);
        return ApiResponse.<ProgressStatsResponse>builder()
                .result(userProgressService.getPublishedCourseProgressStats(publishedCourseId))
                .build();
    }

    @GetMapping("/published-course/{publishedCourseId}/detail")
    public ApiResponse<CourseProgressDetailResponse> getPublishedCourseProgressDetail(
            @PathVariable Integer publishedCourseId) {
        log.info("Getting progress detail for published course: {}", publishedCourseId);
        return ApiResponse.<CourseProgressDetailResponse>builder()
                .result(userProgressService.getPublishedCourseProgressDetail(publishedCourseId))
                .build();
    }

    @PostMapping("/lesson/complete")
    public ApiResponse<CourseProgressDetailResponse> markLessonComplete(
            @RequestBody MarkLessonCompleteRequest request) {
        log.info("Marking lesson {} complete for published course: {}", 
                request.getLessonId(), request.getPublishedCourseId());
        return ApiResponse.<CourseProgressDetailResponse>builder()
                .result(userProgressService.markLessonCompleteForPublishedCourse(request))
                .build();
    }

    @GetMapping("/lesson/{lessonId}/published-course/{publishedCourseId}/is-completed")
    public ApiResponse<Boolean> isLessonCompleted(
            @PathVariable Integer lessonId,
            @PathVariable Integer publishedCourseId) {
        log.info("Checking if lesson {} is completed for published course: {}", 
                lessonId, publishedCourseId);
        return ApiResponse.<Boolean>builder()
                .result(userProgressService.isLessonCompletedForPublishedCourse(publishedCourseId, lessonId))
                .build();
    }
}
