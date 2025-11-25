package com.hoangphihiep.service;

import com.hoangphihiep.dto.request.MarkLessonCompleteRequest;
import com.hoangphihiep.dto.response.*;
import com.hoangphihiep.entity.*;
import com.hoangphihiep.exception.AppException;
import com.hoangphihiep.exception.ErrorCode;
import com.hoangphihiep.mapper.CourseProgressMapper;
import com.hoangphihiep.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Date;
import java.util.List;

/**
 * Service for handling progress tracking for users learning published courses
 * Similar to ProgressService but works with PublishedCourse instead of CourseClass
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserProgressService {

    private final CourseProgressRepository courseProgressRepository;
    private final LessonProgressRepository lessonProgressRepository;
    private final LessonRepository lessonRepository;
    private final SectionRepository sectionRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final AssignmentSubmissionRepository assignmentSubmissionRepository;
    private final CourseProgressMapper courseProgressMapper;
    private final PublishedCourseRepository publishedCourseRepository;
    private final OrderItemRepository orderItemRepository;

    public ProgressStatsResponse getPublishedCourseProgressStats(Integer publishedCourseId) {
        String userId = getCurrentUserId();

        PublishedCourse publishedCourse = publishedCourseRepository.findById(publishedCourseId)
                .orElseThrow(() -> new AppException(ErrorCode.PUBLISHED_COURSE_NOT_FOUND));

        boolean hasPurchased = orderItemRepository.existsByUserIdAndCourseIdAndOrderCompleted(userId, publishedCourseId);
        if (!hasPurchased) {
            throw new AppException(ErrorCode.USER_NOT_ENROLLED);
        }

        Course course = publishedCourse.getCourse();

        List<Section> sections = sectionRepository.findByCourse_IdAndIsPublishedTrue(course.getId());

        int totalLessons = 0;
        int totalQuizzes = 0;
        int totalAssignments = 0;

        for (Section section : sections) {
            totalLessons += (int) section.getLessons().stream()
                    .filter(lesson -> Boolean.TRUE.equals(lesson.getIsPublished()))
                    .count();
            totalQuizzes += (int) section.getQuizs().stream()
                    .filter(quiz -> Boolean.TRUE.equals(quiz.getIsPublished()))
                    .count();
            totalAssignments += (int) section.getAssignments().stream()
                    .filter(assignment -> Boolean.TRUE.equals(assignment.getIsPublished()))
                    .count();
        }

        int completedLessons = (int) lessonProgressRepository
                .findByUserIdAndCourseId(userId, course.getId())
                .stream()
                .filter(LessonProgress::isCompleted)
                .count();

        int completedQuizzes = (int) quizAttemptRepository
                .findByUserIdAndCourseId(userId, course.getId())
                .stream()
                .map(QuizAttempt::getQuiz)
                .distinct()
                .count();

        int completedAssignments = (int) assignmentSubmissionRepository
                .findByUserIdAndCourseId(userId, course.getId())
                .stream()
                .map(AssignmentSubmission::getAssignment)
                .distinct()
                .count();

        int totalItems = totalLessons + totalQuizzes + totalAssignments;
        int completedItems = completedLessons + completedQuizzes + completedAssignments;
        double overallProgress = totalItems > 0 ? ((double) completedItems / totalItems) * 100 : 0;

        return ProgressStatsResponse.builder()
                .totalLessons(totalLessons)
                .completedLessons(completedLessons)
                .totalQuizzes(totalQuizzes)
                .completedQuizzes(completedQuizzes)
                .totalAssignments(totalAssignments)
                .completedAssignments(completedAssignments)
                .overallProgress(overallProgress)
                .build();
    }

    public CourseProgressDetailResponse getPublishedCourseProgressDetail(Integer publishedCourseId) {
        String userId = getCurrentUserId();

        PublishedCourse publishedCourse = publishedCourseRepository.findById(publishedCourseId)
                .orElseThrow(() -> new AppException(ErrorCode.PUBLISHED_COURSE_NOT_FOUND));

        boolean hasPurchased = orderItemRepository.existsByUserIdAndCourseIdAndOrderCompleted(userId, publishedCourseId);
        if (!hasPurchased) {
            throw new AppException(ErrorCode.USER_NOT_ENROLLED);
        }

        Course course = publishedCourse.getCourse();

        CourseProgress courseProgress = courseProgressRepository
                .findByUserIdAndCourseId(userId, course.getId())
                .orElseGet(() -> createCourseProgress(userId, course));

        ProgressStatsResponse stats = getPublishedCourseProgressStats(publishedCourseId);

        CourseProgressResponse courseProgressResponse = courseProgressMapper.toCourseProgressResponse(courseProgress);

        return CourseProgressDetailResponse.builder()
                .courseProgress(courseProgressResponse)
                .totalItems(stats.getTotalLessons() + stats.getTotalQuizzes() + stats.getTotalAssignments())
                .completedItems(stats.getCompletedLessons() + stats.getCompletedQuizzes() + stats.getCompletedAssignments())
                .completedLessons(stats.getCompletedLessons())
                .completedQuizzes(stats.getCompletedQuizzes())
                .completedAssignments(stats.getCompletedAssignments())
                .build();
    }

    @Transactional
    public CourseProgressDetailResponse markLessonCompleteForPublishedCourse(MarkLessonCompleteRequest request) {
        String userId = getCurrentUserId();

        Lesson lesson = lessonRepository.findById(request.getLessonId())
                .orElseThrow(() -> new AppException(ErrorCode.LESSON_NOT_FOUND));

        PublishedCourse publishedCourse = publishedCourseRepository.findById(request.getPublishedCourseId())
                .orElseThrow(() -> new AppException(ErrorCode.PUBLISHED_COURSE_NOT_FOUND));

        boolean hasPurchased = orderItemRepository.existsByUserIdAndCourseIdAndOrderCompleted(userId, request.getPublishedCourseId());
        if (!hasPurchased) {
            throw new AppException(ErrorCode.USER_NOT_ENROLLED);
        }

        Course course = publishedCourse.getCourse();

        CourseProgress courseProgress = courseProgressRepository
                .findByUserIdAndCourseId(userId, course.getId())
                .orElseGet(() -> createCourseProgress(userId, course));

        LessonProgress lessonProgress = lessonProgressRepository
                .findByCourseProgress_IdAndLesson_Id(courseProgress.getId(), lesson.getId())
                .orElseGet(() -> {
                    LessonProgress newLessonProgress = new LessonProgress();
                    newLessonProgress.setLesson(lesson);
                    newLessonProgress.setCourseProgress(courseProgress);
                    newLessonProgress.setCompleted(false);
                    return newLessonProgress;
                });

        lessonProgress.setCompleted(true);
        lessonProgressRepository.save(lessonProgress);

        updateCourseProgressPercentage(courseProgress, course, request.getPublishedCourseId());

        return getPublishedCourseProgressDetail(request.getPublishedCourseId());
    }

    public Boolean isLessonCompletedForPublishedCourse(Integer publishedCourseId, Integer lessonId) {
        String userId = getCurrentUserId();

        PublishedCourse publishedCourse = publishedCourseRepository.findById(publishedCourseId)
                .orElseThrow(() -> new AppException(ErrorCode.PUBLISHED_COURSE_NOT_FOUND));

        Course course = publishedCourse.getCourse();

        CourseProgress courseProgress = courseProgressRepository
                .findByUserIdAndCourseId(userId, course.getId())
                .orElse(null);

        if (courseProgress == null) {
            return false;
        }

        return lessonProgressRepository
                .findByCourseProgress_IdAndLesson_Id(courseProgress.getId(), lessonId)
                .map(LessonProgress::isCompleted)
                .orElse(false);
    }

    private String getCurrentUserId() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    private CourseProgress createCourseProgress(String userId, Course course) {
        CourseProgress courseProgress = new CourseProgress();
        courseProgress.setIdUser(userId);
        courseProgress.setCourse(course);
        courseProgress.setProgressPercentage(0.0);
        courseProgress.setStartDate(new Date(System.currentTimeMillis()));
        courseProgress.setCompleted(false);
        return courseProgressRepository.save(courseProgress);
    }

    private void updateCourseProgressPercentage(CourseProgress courseProgress, Course course, Integer publishedCourseId) {
        ProgressStatsResponse stats = getPublishedCourseProgressStats(publishedCourseId);

        int totalItems = stats.getTotalLessons() + stats.getTotalQuizzes() + stats.getTotalAssignments();
        int completedItems = stats.getCompletedLessons() + stats.getCompletedQuizzes() + stats.getCompletedAssignments();

        double percentage = totalItems > 0 ? ((double) completedItems / totalItems) * 100 : 0;

        courseProgress.setProgressPercentage(percentage);

        if (percentage >= 100.0) {
            courseProgress.setCompleted(true);
            if (courseProgress.getCompleteDate() == null) {
                courseProgress.setCompleteDate(new Date(System.currentTimeMillis()));
            }
        }

        courseProgressRepository.save(courseProgress);
    }
}
