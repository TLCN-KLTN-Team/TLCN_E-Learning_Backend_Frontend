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

@Service
@RequiredArgsConstructor
@Slf4j
public class ProgressService {

    private final CourseProgressRepository courseProgressRepository;
    private final LessonProgressRepository lessonProgressRepository;
    private final CourseClassRepository courseClassRepository;
    private final LessonRepository lessonRepository;
    private final SectionRepository sectionRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final AssignmentSubmissionRepository assignmentSubmissionRepository;
    private final CourseProgressMapper courseProgressMapper;

    public ProgressStatsResponse getClassProgressStats(Integer classId) {
        String userId = getCurrentUserId();

        // Verify student is enrolled
        CourseClass courseClass = courseClassRepository.findById(classId)
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));

        Course course = courseClass.getCourse();

        // Get or create course progress
        CourseProgress courseProgress = courseProgressRepository
                .findByUserIdAndCourseId(userId, course.getId())
                .orElseGet(() -> createCourseProgress(userId, course));

        // Get all sections for this course
        List<Section> sections = sectionRepository.findVisibleSectionsByClassId(course.getId(), classId);

        // Calculate totals
        int totalLessons = 0;
        int totalQuizzes = 0;
        int totalAssignments = 0;

        for (Section section : sections) {
            totalLessons += section.getLessons().size();
            totalQuizzes += section.getQuizs().size();
            totalAssignments += section.getAssignments().size();
        }

        // Calculate completed
        int completedLessons = (int) courseProgress.getLessonProgresses().stream()
                .filter(LessonProgress::isCompleted)
                .count();

        int completedQuizzes = quizAttemptRepository.countDistinctQuizzesByUserAndCourse(userId, course.getId());

        int completedAssignments = assignmentSubmissionRepository.countDistinctAssignmentsByUserAndCourse(userId, course.getId());

        // Calculate overall progress
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
                .overallProgress(Math.round(overallProgress * 10.0) / 10.0)
                .build();
    }

    public CourseProgressDetailResponse getCourseProgressDetail(Integer classId) {
        String userId = getCurrentUserId();

        CourseClass courseClass = courseClassRepository.findById(classId)
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));

        Course course = courseClass.getCourse();

        CourseProgress courseProgress = courseProgressRepository
                .findByUserIdAndCourseId(userId, course.getId())
                .orElseGet(() -> createCourseProgress(userId, course));

        ProgressStatsResponse stats = getClassProgressStats(classId);

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
    public CourseProgressDetailResponse markLessonComplete(MarkLessonCompleteRequest request) {
        String userId = getCurrentUserId();

        Lesson lesson = lessonRepository.findById(request.getLessonId())
                .orElseThrow(() -> new AppException(ErrorCode.LESSON_NOT_FOUND));

        CourseClass courseClass = courseClassRepository.findById(request.getClassId())
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));

        Course course = courseClass.getCourse();

        // Get or create course progress
        CourseProgress courseProgress = courseProgressRepository
                .findByUserIdAndCourseId(userId, course.getId())
                .orElseGet(() -> createCourseProgress(userId, course));

        // Check if lesson progress already exists
        LessonProgress lessonProgress = lessonProgressRepository
                .findByCourseProgress_IdAndLesson_Id(courseProgress.getId(), lesson.getId())
                .orElseGet(() -> {
                    LessonProgress newLessonProgress = new LessonProgress();
                    newLessonProgress.setLesson(lesson);
                    newLessonProgress.setCourseProgress(courseProgress);
                    newLessonProgress.setCompleted(false);
                    return newLessonProgress;
                });

        // Mark as completed
        lessonProgress.setCompleted(true);
        lessonProgressRepository.save(lessonProgress);

        // Recalculate progress percentage
        updateCourseProgressPercentage(courseProgress, course);

        return getCourseProgressDetail(request.getClassId());
    }

    public Boolean isLessonCompleted(Integer classId, Integer lessonId) {
        String userId = getCurrentUserId();

        CourseClass courseClass = courseClassRepository.findById(classId)
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));

        Course course = courseClass.getCourse();

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

    private CourseProgress createCourseProgress(String userId, Course course) {
        CourseProgress courseProgress = new CourseProgress();
        courseProgress.setIdUser(userId);
        courseProgress.setCourse(course);
        courseProgress.setProgressPercentage(0.0);
        courseProgress.setStartDate(new Date(System.currentTimeMillis()));
        courseProgress.setCompleted(false);
        return courseProgressRepository.save(courseProgress);
    }

    private void updateCourseProgressPercentage(CourseProgress courseProgress, Course course) {
        List<Section> sections = sectionRepository.findByCourse_IdAndIsPublishedTrue(course.getId());

        int totalLessons = 0;
        int totalQuizzes = 0;
        int totalAssignments = 0;

        for (Section section : sections) {
            totalLessons += section.getLessons().size();
            totalQuizzes += section.getQuizs().size();
            totalAssignments += section.getAssignments().size();
        }

        int completedLessons = (int) courseProgress.getLessonProgresses().stream()
                .filter(LessonProgress::isCompleted)
                .count();

        int completedQuizzes = quizAttemptRepository
                .countDistinctQuizzesByUserAndCourse(courseProgress.getIdUser(), course.getId());

        int completedAssignments = assignmentSubmissionRepository
                .countDistinctAssignmentsByUserAndCourse(courseProgress.getIdUser(), course.getId());

        int totalItems = totalLessons + totalQuizzes + totalAssignments;
        int completedItems = completedLessons + completedQuizzes + completedAssignments;

        double progressPercentage = totalItems > 0 ? ((double) completedItems / totalItems) * 100 : 0;

        courseProgress.setProgressPercentage(Math.round(progressPercentage * 10.0) / 10.0);

        // Check if course is completed
        if (progressPercentage >= 100) {
            courseProgress.setCompleted(true);
            courseProgress.setCompleteDate(new Date(System.currentTimeMillis()));
        }

        courseProgressRepository.save(courseProgress);
    }

    private String getCurrentUserId() {
        var context = SecurityContextHolder.getContext();
        return context.getAuthentication().getName();
    }
}