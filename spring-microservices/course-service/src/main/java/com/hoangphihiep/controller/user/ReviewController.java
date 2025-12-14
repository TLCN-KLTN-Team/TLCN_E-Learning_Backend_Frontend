package com.hoangphihiep.controller.user;

import com.hoangphihiep.dto.request.ReviewRequest;
import com.hoangphihiep.dto.request.UpdateReviewRequest;
import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.ReviewResponse;
import com.hoangphihiep.dto.response.ReviewStatsResponse;
import com.hoangphihiep.service.ReviewService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/user/reviews")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class ReviewController {
    final ReviewService reviewService;

    @GetMapping("/course/{courseId}")
    public ApiResponse<List<ReviewResponse>> getCourseReviews(@PathVariable Integer courseId) {
        log.info("REST request to get reviews for course: {}", courseId);

        return ApiResponse.<List<ReviewResponse>>builder()
                .message("Get course reviews successfully")
                .result(reviewService.getCourseReviews(courseId))
                .build();
    }

    @GetMapping("/course/{courseId}/stats")
    public ApiResponse<ReviewStatsResponse> getCourseReviewStats(@PathVariable Integer courseId) {
        log.info("REST request to get review stats for course: {}", courseId);
        return ApiResponse.<ReviewStatsResponse>builder()
                .message("Get course review stats successfully")
                .result(reviewService.getCourseReviewStats(courseId))
                .build();
    }

    @GetMapping("/course/{courseId}/my-review")
    public ApiResponse<ReviewResponse> getUserReviewForCourse(@PathVariable Integer courseId) {
        log.info("REST request to get user review for course: {}", courseId);
        return ApiResponse.<ReviewResponse>builder()
                .message("Get user review successfully")
                .result(reviewService.getUserReviewForCourse(courseId))
                .build();
    }

    @PostMapping
    public ApiResponse<ReviewResponse> createReview(@Valid @RequestBody ReviewRequest request) {
        log.info("REST request to create review for course: {}", request.getCourseId());
        return ApiResponse.<ReviewResponse>builder()
                .message("Create review successfully")
                .result(reviewService.createReview(request))
                .build();
    }

    @PutMapping("/{reviewId}")
    public ApiResponse<ReviewResponse> updateReview(
            @PathVariable Integer reviewId,
            @Valid @RequestBody UpdateReviewRequest request) {
        log.info("REST request to update review: {}", reviewId);
        return ApiResponse.<ReviewResponse>builder()
                .message("Update review successfully")
                .result(reviewService.updateReview(reviewId, request))
                .build();
    }

    @DeleteMapping("/{reviewId}")
    public ApiResponse<Void> deleteReview(@PathVariable Integer reviewId) {
        log.info("REST request to delete review: {}", reviewId);
        reviewService.deleteReview(reviewId);
        return ApiResponse.<Void>builder()
                .message("Delete review successfully")
                .build();
    }
}
