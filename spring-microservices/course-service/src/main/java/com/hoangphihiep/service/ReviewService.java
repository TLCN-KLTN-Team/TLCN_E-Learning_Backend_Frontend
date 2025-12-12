package com.hoangphihiep.service;

import com.hoangphihiep.dto.request.ReviewRequest;
import com.hoangphihiep.dto.request.UpdateReviewRequest;
import com.hoangphihiep.dto.response.ReviewResponse;
import com.hoangphihiep.dto.response.ReviewStatsResponse;
import com.hoangphihiep.entity.PublishedCourse;
import com.hoangphihiep.entity.Review;
import com.hoangphihiep.mapper.ReviewMapper;
import com.hoangphihiep.repository.PublishedCourseRepository;
import com.hoangphihiep.repository.ReviewRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class ReviewService {
    ReviewRepository reviewRepository;
    PublishedCourseRepository publishedCourseRepository;
    ReviewMapper reviewMapper;

    public List<ReviewResponse> getCourseReviews(Integer courseId) {
        log.info("Getting reviews for course: {}", courseId);
        List<Review> reviews = reviewRepository.findByCourseIdOrderByCreatedAtDesc(courseId);
        return reviews.stream()
                .map(reviewMapper::toReviewResponse)
                .collect(Collectors.toList());
    }

    public ReviewStatsResponse getCourseReviewStats(Integer courseId) {
        log.info("Getting review stats for course: {}", courseId);
        
        Double averageRating = reviewRepository.getAverageRatingByCourseId(courseId);
        Long totalReviews = reviewRepository.countByCourseId(courseId);
        
        ReviewStatsResponse.RatingDistribution distribution = ReviewStatsResponse.RatingDistribution.builder()
                .fiveStar(reviewRepository.countByCourseIdAndRating(courseId, 5))
                .fourStar(reviewRepository.countByCourseIdAndRating(courseId, 4))
                .threeStar(reviewRepository.countByCourseIdAndRating(courseId, 3))
                .twoStar(reviewRepository.countByCourseIdAndRating(courseId, 2))
                .oneStar(reviewRepository.countByCourseIdAndRating(courseId, 1))
                .build();

        return ReviewStatsResponse.builder()
                .averageRating(averageRating != null ? averageRating : 0.0)
                .totalReviews(totalReviews)
                .ratingDistribution(distribution)
                .build();
    }

    @Transactional
    public ReviewResponse createReview(ReviewRequest request) {
        log.info("Creating review for course: {} by user: {}", request.getCourseId(), getCurrentUserId());
        
        String userId = getCurrentUserId();
        
        // Check if user already reviewed this course
        if (reviewRepository.existsByCourseIdAndCreatedById(request.getCourseId(), userId)) {
            log.warn("User {} already reviewed course {}", userId, request.getCourseId());
            throw new RuntimeException("You have already reviewed this course. Please edit your existing review instead.");
        }
        
        // Find course
        PublishedCourse course = publishedCourseRepository.findById(request.getCourseId())
                .orElseThrow(() -> {
                    log.error("Course not found: {}", request.getCourseId());
                    return new RuntimeException("Course not found with id: " + request.getCourseId());
                });
        
        // Create review
        Review review = Review.builder()
                .rate(request.getRate())
                .content(request.getContent())
                .course(course)
                .createdById(userId)
                .createdAt(new java.sql.Date(System.currentTimeMillis()))
                .build();
        
        review = reviewRepository.save(review);
        log.info("Review created successfully with id: {} for course: {} by user: {}", review.getId(), request.getCourseId(), userId);
        
        return reviewMapper.toReviewResponse(review);
    }

    @Transactional
    public ReviewResponse updateReview(Integer reviewId, UpdateReviewRequest request) {
        log.info("Updating review: {} by user: {}", reviewId, getCurrentUserId());
        
        String userId = getCurrentUserId();
        
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> {
                    log.error("Review not found: {}", reviewId);
                    return new RuntimeException("Review not found with id: " + reviewId);
                });
        
        // Check ownership
        if (!review.getCreatedById().equals(userId)) {
            log.error("User {} attempted to update review {} owned by {}", userId, reviewId, review.getCreatedById());
            throw new RuntimeException("You can only update your own reviews");
        }
        
        log.info("Updating review {} - Old values: rate={}, content length={}", reviewId, review.getRate(), review.getContent().length());
        review.setRate(request.getRate());
        review.setContent(request.getContent());
        
        review = reviewRepository.save(review);
        log.info("Review updated successfully - New values: rate={}, content length={}", review.getRate(), review.getContent().length());
        
        return reviewMapper.toReviewResponse(review);
    }

    @Transactional
    public void deleteReview(Integer reviewId) {
        log.info("Deleting review: {} by user: {}", reviewId, getCurrentUserId());
        
        String userId = getCurrentUserId();
        
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> {
                    log.error("Review not found: {}", reviewId);
                    return new RuntimeException("Review not found with id: " + reviewId);
                });
        
        // Check ownership
        if (!review.getCreatedById().equals(userId)) {
            log.error("User {} attempted to delete review {} owned by {}", userId, reviewId, review.getCreatedById());
            throw new RuntimeException("You can only delete your own reviews");
        }
        
        reviewRepository.delete(review);
        log.info("Review {} deleted successfully by user {}", reviewId, userId);
    }

    public double calculateAverageRatingForCourse(Integer courseId) {
        log.info("Calculating average rating for course: {}", courseId);

        Double averageRating = reviewRepository.getAverageRatingByCourseId(courseId);
        return averageRating != null ? averageRating : 0.0;
    }

    public ReviewResponse getUserReviewForCourse(Integer courseId) {
        log.info("Getting user review for course: {}", courseId);
        
        String userId = getCurrentUserId();
        
        return reviewRepository.findByCourseIdAndCreatedById(courseId, userId)
                .map(reviewMapper::toReviewResponse)
                .orElse(null);
    }

    private String getCurrentUserId() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }
        return authentication.getName();
    }
}
