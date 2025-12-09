package com.hoangphihiep.service;

import com.hoangphihiep.dto.response.*;
import com.hoangphihiep.entity.CourseType;
import com.hoangphihiep.entity.Order;
import com.hoangphihiep.entity.PublishedCourse;
import com.hoangphihiep.exception.AppException;
import com.hoangphihiep.exception.ErrorCode;
import com.hoangphihiep.mapper.OrderMapper;
import com.hoangphihiep.repository.PublishedCourseRepository;
import com.hoangphihiep.repository.httpclient.TeacherRepository;
import com.hoangphihiep.service.searchandfilter.PublishedCourseSearchService;
import com.hoangphihiep.utils.CurrencyUtils;
import com.hoangphihiep.utils.JwtUtils;
import com.hoangphihiep.utils.OrderStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserPublishedCourseService {
    private final PublishedCourseRepository publishedCourseRepository;
    private final CurrencyUtils currencyUtils;
    private final PublishedCourseSearchService publishedCourseSearchService;
    private final TeacherRepository teacherApi;
    private final OrderService orderService;
    private final OrderItemService orderItemService;
    private final OrderMapper orderMapper;

    public List<OrderResponse> getPendingOrders() {
        String userId = JwtUtils.getCurrentUserId();
        List<Order> orders = orderService.getOrdersByUserId();
        List<Order> pendingOrders = orders.stream()
                .filter(order -> order.getOrderStatus().equals(OrderStatus.PENDING))
                .toList();

        return pendingOrders.stream()
                .map(orderMapper::toResponse)
                .toList();
    }

    public List<HomeCourseResponse> getSuggestCourses() {
        List<PublishedCourse> courses = publishedCourseRepository.findAll();
        return null;
    }

    public List<PublishedCourseProgressResponse> getMyPublishedCourse() {
        List<Order> ordersOfUser = orderService.getOrdersByUserId();
        List<Integer> orderIds = ordersOfUser.stream()
                .map(Order::getId)
                .toList();

        Set<Integer> publishedCourseIds = orderItemService.getPurchasedCourseIdsByListOrderIds(orderIds);
        List<PublishedCourse> purchasedCourses = new ArrayList<>();
        publishedCourseIds.forEach(publishedCourseId -> {
            PublishedCourse publishedCourse = publishedCourseRepository.findById(publishedCourseId).orElseThrow(
                    () -> new AppException(ErrorCode.PUBLISHED_COURSE_NOT_FOUND)
            );
            purchasedCourses.add(publishedCourse);
        });

        List<PublishedCourseProgressResponse> result = purchasedCourses.stream()
                .map(pc -> PublishedCourseProgressResponse.builder()
                        .publishedCourseId(pc.getId())
                        .publishedCourseName(pc.getCourse().getCourseName())
                        .authorName(pc.getAuthorName()!=null ? pc.getAuthorName() : "Author Name") // Placeholder for author name
                        .progressPercentage(0) // Placeholder for progress
                        .thumbnailUrl(pc.getCourseImage())
                        .build())
                .toList();

        return result;
    }

    public PaginatedResponse<PublishedCourseCardResponse> getPublishedCoursesWithPaging(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<PublishedCourse> publishedCourses = publishedCourseRepository.findAll(pageable);
        List<PublishedCourseCardResponse> courseCardResponses = publishedCourses.stream()
                .map(publishedCourse -> {
                    PublishedCourseCardResponse response = PublishedCourseCardResponse.builder()
                            .id(publishedCourse.getId())
                            .courseName(publishedCourse.getCourse().getCourseName())
                            .coursePrice(currencyUtils.formatCurrency(publishedCourse.getCoursePrice()))
                            .authorName("...") // Placeholder for author name
                            .build();

                    return response;
                }).toList();

        return PaginatedResponse.<PublishedCourseCardResponse>builder()
                .content(courseCardResponses)
                .size(pageable.getPageSize())
                .page(pageable.getPageNumber())
                .totalElements(publishedCourses.getTotalElements())
                .totalPages(publishedCourses.getTotalPages())
                .build();
    }

    public PublishedCourseDetailResponse getPublishedCourseDetailById(Integer publishedCourseId){
        PublishedCourse publishedCourse = publishedCourseRepository.findById(publishedCourseId).orElseThrow(
                () -> new AppException(ErrorCode.PUBLISHED_COURSE_NOT_FOUND)
        );

        return this.toPublishedCourseDetailResponse(publishedCourse);
    }

    private PublishedCourseDetailResponse toPublishedCourseDetailResponse(PublishedCourse publishedCourse) {
        // calculate duration, rating, student count, etc.

        try {
            var teacher = teacherApi.getTeacherByTeacherId(publishedCourse.getCourse().getIdTeacher()).getResult();

            CourseType courseType = publishedCourse.getCourseType();
            
            // Build sections with published content
            List<SectionResponse> sections = buildPublishedSections(publishedCourse.getCourse());

            PublishedCourseDetailResponse response = PublishedCourseDetailResponse.builder()
                    .courseName(publishedCourse.getCourseName())
                    .description(publishedCourse.getDescription())
                    .starNumber(4.5)
                    .reviews(1200)
                    .students(3500)
                    .duration(3.5)
                    .authorName(publishedCourse.getAuthorName())
                    .coursePrice(currencyUtils.formatCurrency(publishedCourse.getCoursePrice()))
                    .purchaserStatus(orderService.checkCoursePurchased(publishedCourse.getId()))
                    .thumbnailUrl(publishedCourse.getCourseImage())
                    .videoIntroUrl(publishedCourse.getCourseVideo())

                    .courseIntroduction(publishedCourse.getCourseIntroduction())
                    .achievements(publishedCourse.getLearnerAchievements())

                    .courseType(courseType.getCourseTypeName())
                    .descriptionType(courseType.getDescription())
                    
                    // ===== NEW FIELDS =====
                    .courseVideo(publishedCourse.getCourseVideo())
                    .sections(sections)
                    .whatYouWillLearn(publishedCourse.getLearnerAchievements())
                    .targetAudience(publishedCourse.getCourseLearner())
                    .courseTarget(publishedCourse.getCourseTarget())
                    .rating(4.5)  // Alias for starNumber
                    .studentCount(3500)  // Alias for students
                    
                    .build();

            return response;
        } catch (AppException e) {
            throw new AppException(ErrorCode.TEACHER_NOT_FOUND);
        }
    }
    
    private List<SectionResponse> buildPublishedSections(com.hoangphihiep.entity.Course course) {
        if (course == null || course.getSections() == null) {
            return new ArrayList<>();
        }
        
        return course.getSections().stream()
                .filter(section -> section.getIsPublished() != null && section.getIsPublished())
                .sorted((s1, s2) -> Integer.compare(s1.getOrderIndex(), s2.getOrderIndex()))
                .map(section -> SectionResponse.builder()
                        .id(section.getId())
                        .courseId(section.getCourse().getId())
                        .courseName(section.getCourse().getCourseName())
                        .title(section.getTitle())
                        .description(section.getDescription())
                        .orderIndex(section.getOrderIndex())
                        .isPublished(section.getIsPublished())
                        .createdAt(section.getCreatedAt())
                        .updateAt(section.getUpdateAt())
                        .lessons(buildPublishedLessons(section))
                        .quizs(buildPublishedQuizzes(section))
                        .assignments(buildPublishedAssignments(section))
                        .build())
                .toList();
    }
    
    private Set<LessonResponse> buildPublishedLessons(com.hoangphihiep.entity.Section section) {
        if (section.getLessons() == null) {
            return new HashSet<>();
        }
        
        return section.getLessons().stream()
                .filter(lesson -> lesson.getIsPublished() != null && lesson.getIsPublished())
                .sorted((l1, l2) -> Integer.compare(l1.getNumberItem(), l2.getNumberItem()))
                .map(lesson -> LessonResponse.builder()
                        .id(lesson.getId())
                        .sectionId(section.getId())
                        .sectionName(section.getTitle())
                        .title(lesson.getTitle())
                        .description(lesson.getDescription())
                        .content(lesson.getContent())
                        .attachments(lesson.getAttachments())
                        .videoUrl(lesson.getVideoUrl())
                        .numberItem(lesson.getNumberItem())
                        .isFreeLesson(lesson.getIsFreeLesson())
                        .isPublished(lesson.getIsPublished())
                        .createdAt(lesson.getCreatedAt())
                        .updateAt(lesson.getUpdateAt())
                        .build())
                .collect(Collectors.toSet());
    }
    
    private Set<QuizResponse> buildPublishedQuizzes(com.hoangphihiep.entity.Section section) {
        if (section.getQuizs() == null) {
            return new HashSet<>();
        }
        
        return section.getQuizs().stream()
                .filter(quiz -> quiz.getIsPublished() != null && quiz.getIsPublished())
                .sorted((q1, q2) -> Integer.compare(q1.getNumberItem(), q2.getNumberItem()))
                .map(quiz -> QuizResponse.builder()
                        .id(quiz.getId())
                        .sectionId(section.getId())
                        .sectionName(section.getTitle())
                        .title(quiz.getTitle())
                        .description(quiz.getDescription())
                        .duration(quiz.getDuration())
                        .attemptLimit(quiz.getAttemptLimit())
                        .passingScore(quiz.getPassingScore())
                        .numberItem(quiz.getNumberItem())
                        .showResults(quiz.getShowResults())
                        .isPublished(quiz.getIsPublished())
                        .questions(quiz.getQuestions() != null ? 
                                quiz.getQuestions().stream()
                                        .map(this::toQuestionResponse)
                                        .collect(Collectors.toSet()) : new HashSet<>())
                        .attemptsCount(0)  // TODO: Calculate from submissions
                        .startTime(quiz.getStartTime())
                        .endTime(quiz.getEndTime())
                        .createdAt(quiz.getCreatedAt())
                        .updateAt(quiz.getUpdateAt())
                        .build())
                .collect(Collectors.toSet());
    }
    
    private Set<AssignmentResponse> buildPublishedAssignments(com.hoangphihiep.entity.Section section) {
        if (section.getAssignments() == null) {
            return new HashSet<>();
        }
        
        return section.getAssignments().stream()
                .filter(assignment -> assignment.getIsPublished() != null && assignment.getIsPublished())
                .sorted((a1, a2) -> Integer.compare(a1.getNumberItem(), a2.getNumberItem()))
                .map(assignment -> AssignmentResponse.builder()
                        .id(assignment.getId())
                        .sectionId(section.getId())
                        .sectionName(section.getTitle())
                        .title(assignment.getTitle())
                        .description(assignment.getDescription())
                        .deadline(assignment.getDeadline())
                        .assignmentFiles(assignment.getAssignmentFiles())
                        .submissionType(assignment.getSubmissionType())
                        .rubricFiles(assignment.getRubricFiles())
                        .maxScore(assignment.getMaxScore())
                        .numberItem(assignment.getNumberItem())
                        .isPublished(assignment.getIsPublished())
                        .createdAt(assignment.getCreatedAt())
                        .updateAt(assignment.getUpdateAt())
                        .submissionsCount(0)  // TODO: Calculate from submissions
                        .build())
                .collect(Collectors.toSet());
    }
    
    private QuestionResponse toQuestionResponse(com.hoangphihiep.entity.Question question) {
        // TODO: Implement proper question mapping
        return QuestionResponse.builder()
                .id(question.getId())
                .questionText(question.getQuestionText())
                .build();
    }
}
