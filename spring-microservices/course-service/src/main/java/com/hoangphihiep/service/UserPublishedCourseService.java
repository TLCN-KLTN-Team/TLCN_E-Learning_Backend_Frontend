package com.hoangphihiep.service;

import com.hoangphihiep.dto.response.*;
import com.hoangphihiep.entity.CourseType;
import com.hoangphihiep.entity.Order;
import com.hoangphihiep.entity.PublishedCourse;
import com.hoangphihiep.exception.AppException;
import com.hoangphihiep.exception.ErrorCode;
import com.hoangphihiep.mapper.OrderMapper;
import com.hoangphihiep.repository.OrderRepository;
import com.hoangphihiep.repository.PublishedCourseRepository;
import com.hoangphihiep.repository.ReviewRepository;
import com.hoangphihiep.repository.QuizQuestionRepository;
import com.hoangphihiep.repository.httpclient.TeacherRepository;
import com.hoangphihiep.mapper.QuestionMapper;
import com.hoangphihiep.service.searchandfilter.PublishedCourseSearchService;
import com.hoangphihiep.utils.CurrencyUtils;
import com.hoangphihiep.utils.JwtUtils;
import com.hoangphihiep.utils.OrderStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.*;
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
    private final ReviewRepository reviewRepository;
    private final OrderRepository orderRepository;
    private final ReviewService reviewService;
    private final QuizQuestionRepository quizQuestionRepository;
    private final QuestionMapper questionMapper;
    private final UserProgressService userProgressService;

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

    public List<PublishedCourseCardResponse> getCoursesByRating() {
        List<PublishedCourse> courses = publishedCourseRepository.findAll();
        return courses.stream()
                .filter(course -> reviewService.calculateAverageRatingForCourse(course.getId()) > 4.5
                    && !orderService.isCoursePurchasedByCurrentUser(course.getId()))
                .map(this::toCardResponse)
                .toList();
    }

    public List<PublishedCourseCardResponse> getTop12BestSellingCourses() {
        Pageable limit = PageRequest.of(0, 12);

        List<PublishedCourse> courses = publishedCourseRepository.findTopBestSellingCourses(limit);

        return courses.stream()
                .filter(course -> !orderService.isCoursePurchasedByCurrentUser(course.getId()))
                .map(this::toCardResponse)
                .toList();
    }

    private PublishedCourseCardResponse toCardResponse(PublishedCourse course) {
        return PublishedCourseCardResponse.builder()
                .id(course.getId())
                .courseName(course.getCourse().getCourseName())
                .coursePrice(currencyUtils.formatCurrency(course.getCoursePrice()))
                .authorName(course.getAuthorName())
                .thumbnailUrl(course.getCourseImage())
                .rating(reviewService.calculateAverageRatingForCourse(course.getId()))
                .reviewCount(course.getReview().size())
                .studentCount(orderService.countNumberOfPurchasePerCourse(course.getId()))
                .category(course.getCourseType().getCourseTypeName())
                .build();
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
                .map(pc -> {
                    double progressPercentage = 0;
                    try {
                        // Calculate real progress using UserProgressService
                        ProgressStatsResponse progressStats = userProgressService.getPublishedCourseProgressStats(pc.getId());
                        progressPercentage = Math.round(progressStats.getOverallProgress() * 100.0) / 100.0;
                    } catch (Exception e) {
                        // If user hasn't started or error, keep 0
                        progressPercentage = 0;
                    }
                    
                    return PublishedCourseProgressResponse.builder()
                            .publishedCourseId(pc.getId())
                            .publishedCourseName(pc.getCourse().getCourseName())
                            .authorName(pc.getAuthorName()!=null ? pc.getAuthorName() : "Author Name")
                            .progressPercentage(progressPercentage)
                            .thumbnailUrl(pc.getCourseImage())
                            .build();
                })
                .toList();

        return result;
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
            String teacherId = publishedCourse.getCourse().getIdTeacher();

            CourseType courseType = publishedCourse.getCourseType();
            
            // Build sections with published content
            List<SectionResponse> sections = buildPublishedSections(publishedCourse.getCourse());
            
            // Build instructor info with statistics
            InstructorInfoResponse instructorInfo = buildInstructorInfo(teacher, teacherId);

            // Real stats
            double avgRating = reviewService.calculateAverageRatingForCourse(publishedCourse.getId());
            long totalReviews = reviewRepository.countByCourseId(publishedCourse.getId());
            long totalStudents = orderService.countNumberOfPurchasePerCourse(publishedCourse.getId());

            String lastUpdated = publishedCourse.getUpdatedAt() != null
                    ? new java.text.SimpleDateFormat("MM/yyyy").format(publishedCourse.getUpdatedAt())
                    : "N/A";

            PublishedCourseDetailResponse response = PublishedCourseDetailResponse.builder()
                    .courseName(publishedCourse.getCourseName())
                    .description(publishedCourse.getDescription())
                    .starNumber(avgRating)
                    .reviews((int) totalReviews)
                    .students((int) totalStudents)
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
                    .learnerAchievements(publishedCourse.getLearnerAchievements())
                    .courseLearner(publishedCourse.getCourseLearner())
                    .courseTarget(publishedCourse.getCourseTarget())
                    .instructorInfo(instructorInfo)
                    .teacherInfo(instructorInfo)  // Alias for frontend compatibility
                    .rating(avgRating)  // Alias for starNumber
                    .studentCount((int) totalStudents)  // Alias for students
                    .lastUpdated(lastUpdated)
                    
                    .build();

            return response;
        } catch (AppException e) {
            throw new AppException(ErrorCode.TEACHER_NOT_FOUND);
        }
    }
    
    private InstructorInfoResponse buildInstructorInfo(TeacherResponse teacher, String teacherId) {
        // Count statistics for the instructor
        long totalCourses = publishedCourseRepository.countApprovedCoursesByTeacherId(teacherId);
        long totalReviews = reviewRepository.countReviewsByTeacherId(teacherId);
        Double avgRating = reviewRepository.getAverageRatingByTeacherId(teacherId);
        long totalStudents = orderRepository.countUniqueStudentsByTeacherId(teacherId);
        
        // Combine first and last name with space
        String fullName = (teacher.getFirstName() != null ? teacher.getFirstName() : "") + 
                         (teacher.getLastName() != null ? " " + teacher.getLastName() : "");
        fullName = fullName.trim();
        
        // Use provided avatar or generate default avatar from name
        String avatarUrl = teacher.getAvatarUrl();
        if (avatarUrl == null || avatarUrl.isEmpty()) {
            // Generate default avatar using UI Avatars service with teacher's name
            String nameParam = fullName.replace(" ", "+");
            avatarUrl = "https://ui-avatars.com/api/?name=" + nameParam + "&background=random&color=fff&bold=true&size=200";
        }
        
        System.out.println("Teacher ID: " + teacher.getTeacherId());
        System.out.println("Avatar URL: " + avatarUrl);
        System.out.println("Full Name: " + fullName);
        
        return InstructorInfoResponse.builder()
                .instructorId(teacher.getTeacherId())
                .instructorName(fullName)
                .instructorAvatar(avatarUrl)
                .instructorTagline("Learn IT, Practice IT, Do IT")  // Default tagline, can be from DB
                .instructorBio(teacher.getDescription())
                .socialUrl(teacher.getSocialUrl())
                .instructorRating(avgRating != null ? avgRating : 0.0)
                .totalReviews((int) totalReviews)
                .totalStudents((int) totalStudents)
                .totalCourses((int) totalCourses)
                .build();
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
                        .questions(quizQuestionRepository.findByQuizIdOrderByOrderIndex(quiz.getId()).stream()
                                .map(qq -> questionMapper.toQuestionResponse(qq.getQuestion()))
                                .collect(Collectors.toCollection(LinkedHashSet::new)))
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
