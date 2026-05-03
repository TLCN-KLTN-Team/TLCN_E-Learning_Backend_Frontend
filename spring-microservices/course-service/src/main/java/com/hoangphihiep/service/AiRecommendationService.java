package com.hoangphihiep.service;

import com.hoangphihiep.dto.request.ai.AiRecommendationRequest;
import com.hoangphihiep.dto.request.ai.Candidate;
import com.hoangphihiep.dto.request.ai.UserProfile;
import com.hoangphihiep.dto.response.PublishedCourseCardResponse;
import com.hoangphihiep.dto.response.ai.AiRecommendationResponse;
import com.hoangphihiep.entity.FavoriteCourse;
import com.hoangphihiep.entity.Order;
import com.hoangphihiep.entity.PublishedCourse;
import com.hoangphihiep.repository.FavoriteCourseRepository;
import com.hoangphihiep.repository.PublishedCourseRepository;
import com.hoangphihiep.utils.CurrencyUtils;
import com.hoangphihiep.utils.JwtUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiRecommendationService {

    private final PublishedCourseRepository publishedCourseRepository;
    private final FavoriteCourseRepository favoriteCourseRepository;
    private final com.hoangphihiep.repository.OrderRepository orderRepository;
    private final RestTemplate restTemplate;
    
    // Services for mapping
    private final CurrencyUtils currencyUtils;
    private final ReviewService reviewService;
    private final OrderService orderService;

    private static final String AI_SERVICE_URL = "http://localhost:8002/api/v1/recommend";

    public List<PublishedCourseCardResponse> getRecommendedCourses() {
        String userId = JwtUtils.getCurrentUserId();
        if (userId == null) {
            return Collections.emptyList();
        }

        try {
            // 1. Build User Profile
            UserProfile userProfile = buildUserProfile(userId);

            // 2. Build Candidates (All Published Courses)
            List<PublishedCourse> allCourses = publishedCourseRepository.findAll(); 
            List<Candidate> candidates = allCourses.stream()
                    .map(this::toCandidate)
                    .toList();

            if (candidates.isEmpty()) {
                return Collections.emptyList();
            }

            // 3. Prepare Request
            AiRecommendationRequest request = AiRecommendationRequest.builder()
                    .userProfile(userProfile)
                    .candidates(candidates)
                    .topK(8) 
                    .build();

            // 4. Call AI Service
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<AiRecommendationRequest> entity = new HttpEntity<>(request, headers);

            AiRecommendationResponse response = restTemplate.postForObject(
                    AI_SERVICE_URL,
                    entity,
                    AiRecommendationResponse.class
            );

            if (response == null || response.getRecommendations() == null) {
                log.warn("AI Service returned null or empty recommendations");
                return Collections.emptyList();
            }

            List<String> recommendedIds = response.getRecommendations().stream()
                    .map(item -> item.getId())
                    .collect(Collectors.toList());
            
            // 5. Map IDs back to PublishedCourseCardResponse
            return allCourses.stream()
                    .filter(c -> recommendedIds.contains(c.getId().toString()) || recommendedIds.contains(String.valueOf(c.getId())))
                    .map(this::toPublishedCourseCardResponse)
                    .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("Error getting AI recommendations", e);
            return Collections.emptyList();
        }
    }

    private UserProfile buildUserProfile(String userId) {
        // Interests from Favorites
        Optional<FavoriteCourse> favorite = favoriteCourseRepository.findByUserId(userId);
        List<String> interests = new ArrayList<>();
        if (favorite.isPresent()) {
            interests = favorite.get().getCourses().stream()
                    .map(c -> c.getCourse().getCourseName())
                    .collect(Collectors.toList());
        }

        // History from Orders (Purchased Courses)
        List<Order> orders = orderRepository.findByUserIdOrderByOrderDateDesc(userId);
        List<String> history = orders.stream()
                .flatMap(order -> order.getOrderItems().stream())
                .map(orderItem -> {
                    if (orderItem.getCourse() != null) {
                        return orderItem.getCourse().getCourseName();
                    }
                    return "";
                })
                .filter(s -> !s.isEmpty())
                .distinct()
                .collect(Collectors.toList());

        log.info("Found {} orders for user {}. History: {}", orders.size(), userId, history);
        
        return UserProfile.builder()
                .userId(userId)
                .interests(interests)
                .history(history)
                .build();
    }

    private Candidate toCandidate(PublishedCourse course) {
        return Candidate.builder()
                .id(String.valueOf(course.getId()))
                .title(course.getCourseName())
                .description(course.getDescription() != null ? course.getDescription() : "")
                .build();
    }

    private PublishedCourseCardResponse toPublishedCourseCardResponse(PublishedCourse course) {
        return PublishedCourseCardResponse.builder()
                .id(course.getId())
                .courseName(course.getCourseName())
                .coursePrice(currencyUtils.formatCurrency(course.getCoursePrice()))
                .amountPrice(course.getCoursePrice())
                .authorName(course.getAuthorName())
                .thumbnailUrl(course.getCourseImage())
                .rating(reviewService.calculateAverageRatingForCourse(course.getId()))
                .reviewCount(course.getReview().size())
                .studentCount(orderService.countNumberOfPurchasePerCourse(course.getId()))
                .category(course.getCourseType().getCourseTypeName())
                // Fields not present in Course entity:
                // .level(course.getCourse().getLevel())
                // .duration(course.getCourse().getDuration()) 
                // .isHandsOn(course.getCourse().getIsHandsOn())
                .build();
    }
}
