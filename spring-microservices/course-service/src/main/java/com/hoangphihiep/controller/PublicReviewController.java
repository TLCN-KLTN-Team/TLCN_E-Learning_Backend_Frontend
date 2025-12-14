package com.hoangphihiep.controller;

import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.ReviewResponse;
import com.hoangphihiep.dto.response.ReviewStatsResponse;
import com.hoangphihiep.service.ReviewService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/anonymous/reviews")
public class PublicReviewController {

    final ReviewService reviewService;
    @GetMapping("/course/{courseId}")
    public ApiResponse<List<ReviewResponse>> getCourseReviews(@PathVariable Integer courseId) {

        return ApiResponse.<List<ReviewResponse>>builder()
                .message("Get course reviews successfully")
                .result(reviewService.getCourseReviews(courseId))
                .build();
    }

    @GetMapping("/course/{courseId}/stats")
    public ApiResponse<ReviewStatsResponse> getCourseReviewStats(@PathVariable Integer courseId) {
        return ApiResponse.<ReviewStatsResponse>builder()
                .message("Get course review stats successfully")
                .result(reviewService.getCourseReviewStats(courseId))
                .build();
    }
}
