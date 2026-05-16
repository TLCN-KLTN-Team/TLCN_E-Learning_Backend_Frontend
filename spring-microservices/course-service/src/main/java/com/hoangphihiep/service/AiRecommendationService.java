package com.hoangphihiep.service;

import com.hoangphihiep.dto.request.ai.AiRecommendationRequest;
import com.hoangphihiep.dto.request.ai.Candidate;
import com.hoangphihiep.dto.request.ai.UserProfile;
import com.hoangphihiep.dto.response.PublishedCourseCardResponse;
import com.hoangphihiep.dto.response.ai.AiRecommendationResponse;
import com.hoangphihiep.entity.*;
import com.hoangphihiep.repository.*;
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
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiRecommendationService {

    private static final Pattern COURSE_ID_PATTERN = Pattern.compile("(\\d+)(?:/)?$");

    private final PublishedCourseRepository publishedCourseRepository;
    private final FavoriteCourseRepository favoriteCourseRepository;
    private final OrderRepository orderRepository;
    private final CourseProgressRepository courseProgressRepository;
    private final PageVisitRepository pageVisitRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final ReviewRepository reviewRepository;
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
            // 1. Build Enhanced User Profile with behavioral data
            UserProfile userProfile = buildUserProfile(userId);

            // 2. Get all published courses
            List<PublishedCourse> allCourses = publishedCourseRepository.findAll();
            
            // 3. Get user's purchased courses (to exclude from recommendations)
            Set<Integer> purchasedCourseIds = getPurchasedCourseIds(userId);
            
            // 4. Filter candidates: exclude already purchased & completed courses
            List<Candidate> candidates = allCourses.stream()
                    .filter(c -> !purchasedCourseIds.contains(c.getId()))
                    .map(this::toCandidate)
                    .toList();

            if (candidates.isEmpty()) {
                log.warn("No new courses available for recommendation to user: {}", userId);
                return Collections.emptyList();
            }

            log.info("Building recommendation request for user {} with {} candidates", userId, candidates.size());

            // 5. Prepare Request
            AiRecommendationRequest request = AiRecommendationRequest.builder()
                    .userProfile(userProfile)
                    .candidates(candidates)
                    .topK(8) 
                    .build();

            // 6. Call AI Service
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
            
            // 7. Map IDs back to PublishedCourseCardResponse
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
        List<String> interests = new ArrayList<>();
        List<String> history = new ArrayList<>();
        List<String> behaviorSignals = new ArrayList<>();
        List<String> collaborativeSignals = new ArrayList<>();

        // ===== LEVEL 1: Interests from Favorites =====
        Optional<FavoriteCourse> favorite = favoriteCourseRepository.findByUserId(userId);
        if (favorite.isPresent()) {
            List<String> favoriteNames = favorite.get().getCourses().stream()
                    .map(c -> c.getCourse().getCourseName())
                    .collect(Collectors.toList());
            interests.addAll(favoriteNames);
            log.debug("User {} has {} favorite courses", userId, favoriteNames.size());
        }

        // ===== LEVEL 2: Interests from Highly Engaged Courses =====
        // Courses with high progress (>50%) indicate strong interest
        List<String> engagedCourses = getHighEngagementCourses(userId);
        log.debug("engagedCourses: {}", engagedCourses);
        interests.addAll(engagedCourses);

        // Page visit behavior signals from course page clicks/views
        behaviorSignals.addAll(getPageVisitSignals(userId));

        // Quiz attempt signals from learning activity
        behaviorSignals.addAll(getQuizAttemptSignals(userId));

        // Item-based collaborative signals from similar users' favorites/purchases
        collaborativeSignals.addAll(getCollaborativeSignals(userId));
        
        // ===== LEVEL 3: History from Purchased Courses =====
        List<Order> orders = orderRepository.findByUserIdOrderByOrderDateDesc(userId);
        history = orders.stream()
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

        // ===== LEVEL 4: Add behavioral signals to interests =====
        // Courses with reviews → strong engagement signal
        List<String> reviewedCourses = getReviewedCourses(userId);
        interests.addAll(reviewedCourses);

        // Remove duplicates and limit size for better LLM processing
        interests = interests.stream()
                .distinct()
                .limit(15)
                .collect(Collectors.toList());

        log.info("Built profile for user {}: {} interests, {} history entries, engagement score calculated",
                userId, interests.size(), history.size());
        
        return UserProfile.builder()
                .userId(userId)
                .interests(interests)
                .history(history)
                .behaviorSignals(behaviorSignals.stream().distinct().limit(20).collect(Collectors.toList()))
                .collaborativeSignals(collaborativeSignals.stream().distinct().limit(20).collect(Collectors.toList()))
                .build();
    }

    private List<String> getCollaborativeSignals(String userId) {
        try {
            Set<Integer> userCourseIds = new HashSet<>();
            Set<String> userCourseNames = new HashSet<>();

            favoriteCourseRepository.findByUserId(userId).ifPresent(favorite -> {
                favorite.getCourses().forEach(course -> {
                    userCourseIds.add(course.getId());
                    userCourseNames.add(course.getCourseName());
                });
            });

            orderRepository.findByUserIdOrderByOrderDateDesc(userId).forEach(order ->
                    order.getOrderItems().forEach(orderItem -> {
                        if (orderItem.getCourse() != null) {
                            userCourseIds.add(orderItem.getCourse().getId());
                            userCourseNames.add(orderItem.getCourse().getCourseName());
                        }
                    })
            );

            Map<Integer, Integer> coOccurrenceScores = new HashMap<>();

            // Favorite-based co-occurrence: users who liked the same course often liked others too
            for (Integer courseId : userCourseIds) {
                for (FavoriteCourse favoriteCourse : favoriteCourseRepository.findByCourseId(courseId)) {
                    for (PublishedCourse peerCourse : favoriteCourse.getCourses()) {
                        if (!userCourseIds.contains(peerCourse.getId())) {
                            coOccurrenceScores.merge(peerCourse.getId(), 1, Integer::sum);
                        }
                    }
                }
            }

            // Purchase-based co-occurrence: courses bought together by other users
            for (Order order : orderRepository.findAll()) {
                Set<Integer> orderCourseIds = order.getOrderItems().stream()
                        .map(OrderItem::getCourse)
                        .filter(Objects::nonNull)
                        .map(PublishedCourse::getId)
                        .collect(Collectors.toSet());

                if (Collections.disjoint(orderCourseIds, userCourseIds)) {
                    continue;
                }

                for (Integer peerCourseId : orderCourseIds) {
                    if (!userCourseIds.contains(peerCourseId)) {
                        coOccurrenceScores.merge(peerCourseId, 1, Integer::sum);
                    }
                }
            }

            return coOccurrenceScores.entrySet().stream()
                    .sorted(Map.Entry.<Integer, Integer>comparingByValue().reversed())
                    .limit(10)
                    .map(entry -> publishedCourseRepository.findById(entry.getKey())
                            .map(course -> String.format("Users similar to this learner also liked '%s' (score %d)", course.getCourseName(), entry.getValue()))
                            .orElse(String.format("Users similar to this learner also liked course ID %d (score %d)", entry.getKey(), entry.getValue())))
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.warn("Error getting collaborative signals for user {}: {}", userId, e.getMessage());
            return Collections.emptyList();
        }
    }

    private List<String> getPageVisitSignals(String userId) {
        try {
            Map<Integer, Long> courseVisitCounts = new HashMap<>();

            for (PageVisit visit : pageVisitRepository.findByUserIdOrderByVisitTimeDesc(userId)) {
                Integer courseId = extractCourseIdFromUrl(visit.getPageUrl());
                if (courseId != null) {
                    courseVisitCounts.merge(courseId, 1L, Long::sum);
                }
            }

            return courseVisitCounts.entrySet().stream()
                    .sorted(Map.Entry.<Integer, Long>comparingByValue().reversed())
                    .limit(10)
                    .map(entry -> publishedCourseRepository.findById(entry.getKey())
                            .map(course -> String.format("Viewed course '%s' %d times", course.getCourseName(), entry.getValue()))
                            .orElse(String.format("Viewed course ID %d %d times", entry.getKey(), entry.getValue())))
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.warn("Error getting page visit signals for user {}: {}", userId, e.getMessage());
            return Collections.emptyList();
        }
    }

    private List<String> getQuizAttemptSignals(String userId) {
        try {
            return quizAttemptRepository.findByIdUserAndSubmittedAtIsNotNullOrderBySubmittedAtDesc(userId)
                    .stream()
                    .collect(Collectors.groupingBy(
                            attempt -> attempt.getQuiz().getSection().getCourse().getId(),
                            LinkedHashMap::new,
                            Collectors.toList()))
                    .entrySet().stream()
                    .limit(10)
                    .map(entry -> {
                        Integer courseId = entry.getKey();
                        List<QuizAttempt> attempts = entry.getValue();
                        double avgScore = attempts.stream()
                                .mapToDouble(attempt -> {
                                    if (attempt.getTotalScore() == 0) {
                                        return 0.0;
                                    }
                                    return (attempt.getScore() * 100.0) / attempt.getTotalScore();
                                })
                                .average()
                                .orElse(0.0);

                        String courseName = publishedCourseRepository.findById(courseId)
                                .map(PublishedCourse::getCourseName)
                                .orElse("Course ID " + courseId);

                        return String.format("Quiz attempts for '%s': %d attempts, avg score %.1f%%", courseName, attempts.size(), avgScore);
                    })
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.warn("Error getting quiz signals for user {}: {}", userId, e.getMessage());
            return Collections.emptyList();
        }
    }

    private Integer extractCourseIdFromUrl(String pageUrl) {
        if (pageUrl == null || pageUrl.isBlank()) {
            return null;
        }

        Matcher matcher = COURSE_ID_PATTERN.matcher(pageUrl);
        if (matcher.find()) {
            try {
                return Integer.parseInt(matcher.group(1));
            } catch (NumberFormatException ignored) {
                return null;
            }
        }

        return null;
    }

    private List<String> getHighEngagementCourses(String userId) {
        try {
            return publishedCourseRepository.findAll().stream()
                    .filter(course -> {
                        Optional<CourseProgress> progress = courseProgressRepository
                                .findByUserIdAndCourseId(userId, course.getId());
                        return progress.isPresent() && progress.get().getProgressPercentage() > 50;
                    })
                    .map(PublishedCourse::getCourseName)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.warn("Error getting high engagement courses for user {}: {}", userId, e.getMessage());
            return Collections.emptyList();
        }
    }

    private List<String> getReviewedCourses(String userId) {
        try {
            // Get all reviews by this user
            return publishedCourseRepository.findAll().stream()
                    .filter(course -> {
                        Optional<Review> review = reviewRepository.findByCourseIdAndCreatedById(course.getId(), userId);
                        return review.isPresent();
                    })
                    .map(PublishedCourse::getCourseName)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.warn("Error getting reviewed courses for user {}: {}", userId, e.getMessage());
            return Collections.emptyList();
        }
    }

    private Set<Integer> getPurchasedCourseIds(String userId) {
        try {
            return orderRepository.findByUserIdOrderByOrderDateDesc(userId).stream()
                    .flatMap(order -> order.getOrderItems().stream())
                    .map(orderItem -> orderItem.getCourse().getId())
                    .collect(Collectors.toSet());
        } catch (Exception e) {
            log.warn("Error getting purchased courses for user {}: {}", userId, e.getMessage());
            return Collections.emptySet();
        }
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
                .build();
    }
}
