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
    private final ClassContentVisibilityRepository visibilityRepository;

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

        // Get all visible contents for this class
        List<ClassContentVisibility> classVisibilities = visibilityRepository.findByCourseClassId(classId).stream()
                .filter(v -> Boolean.TRUE.equals(v.getIsVisible()))
                .toList();

        for (Section section : sections) {
            totalLessons += (int) section.getLessons().stream()
                    .filter(lesson -> classVisibilities.stream()
                            .anyMatch(v -> "LESSON".equals(v.getContentType()) && v.getContentId().equals(lesson.getId())))
                    .count();
            totalQuizzes += (int) section.getQuizs().stream()
                    .filter(quiz -> classVisibilities.stream()
                            .anyMatch(v -> "QUIZ".equals(v.getContentType()) && v.getContentId().equals(quiz.getId())))
                    .count();
            totalAssignments += (int) section.getAssignments().stream()
                    .filter(assignment -> classVisibilities.stream()
                            .anyMatch(v -> "ASSIGNMENT".equals(v.getContentType()) && v.getContentId().equals(assignment.getId())))
                    .count();
        }

        // Calculate completed
        int completedLessons = (int) courseProgress.getLessonProgresses().stream()
                .filter(LessonProgress::getCompleted)
                .count();

        int completedQuizzes = quizAttemptRepository.countDistinctQuizzesByUserAndCourse(userId, course.getId());

        int completedAssignments = assignmentSubmissionRepository.countDistinctAssignmentsByUserAndCourse(userId, course.getId());

                // Calculate overall progress
                int totalItems = totalLessons + totalQuizzes + totalAssignments;
                int completedItems = completedLessons + completedQuizzes + completedAssignments;
                double overallProgress = totalItems > 0 ? ((double) completedItems / totalItems) * 100 : 0;

                // Credit transfer approval marks the course as completed in CourseProgress.
                // Keep class progress stats consistent with that completion state.
                if (Boolean.TRUE.equals(courseProgress.getCompletedViaCreditTransfer())) {
                        completedLessons = totalLessons;
                        completedQuizzes = totalQuizzes;
                        completedAssignments = totalAssignments;
                        overallProgress = 100.0;
                }

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

    public CourseProgressResponse getCourseProgressDetail(Integer classId) {
        String userId = getCurrentUserId();

        CourseClass courseClass = courseClassRepository.findById(classId)
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));

        Course course = courseClass.getCourse();

        CourseProgress courseProgress = courseProgressRepository
                .findByUserIdAndCourseId(userId, course.getId())
                .orElseGet(() -> createCourseProgress(userId, course));

        System.out.println("=== CourseProgress ID: " + courseProgress.getId());
        courseProgress.getLessonProgresses().forEach(lp -> {
            System.out.println("LessonId=" + lp.getLesson().getId() +
                    ", isCompleted=" + lp.getCompleted());
        });

        ProgressStatsResponse stats = getClassProgressStats(classId);

        CourseProgressResponse courseProgressResponse = courseProgressMapper.toCourseProgressResponse(courseProgress);

        System.out.println("=== CourseProgressResponse ID: " + courseProgressResponse.getId());
        courseProgressResponse.getLessonProgresses().forEach(lp -> {
            System.out.println("CourseProgressResponse LessonId=" + lp.getLessonId() +
                    ", isCompleted=" + lp.isCompleted());
        });

        return courseProgressResponse;
    }

    @Transactional
    public CourseProgressResponse markLessonComplete(MarkLessonCompleteRequest request) {
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
        // Get classId from enrollments
        int classId = courseProgress.getCourse().getEnrollments().stream()
                .filter(e -> e.getStudentId().equals(courseProgress.getIdUser()))
                .map(e -> e.getCourseClass().getId())
                .findFirst()
                .orElse(-1);

        // Get all visible sections
        List<Section> sections = sectionRepository.findVisibleSectionsByClassId(course.getId(), classId);

        List<ClassContentVisibility> classVisibilities = visibilityRepository.findByCourseClassId(classId).stream()
                .filter(v -> Boolean.TRUE.equals(v.getIsVisible()))
                .toList();

        int totalLessons = 0;
        int totalQuizzes = 0;
        int totalAssignments = 0;

        for (Section section : sections) {
            totalLessons += (int) section.getLessons().stream()
                    .filter(lesson -> classVisibilities.stream()
                            .anyMatch(v -> "LESSON".equals(v.getContentType()) && v.getContentId().equals(lesson.getId())))
                    .count();
            totalQuizzes += (int) section.getQuizs().stream()
                    .filter(quiz -> classVisibilities.stream()
                            .anyMatch(v -> "QUIZ".equals(v.getContentType()) && v.getContentId().equals(quiz.getId())))
                    .count();
            totalAssignments += (int) section.getAssignments().stream()
                    .filter(assignment -> classVisibilities.stream()
                            .anyMatch(v -> "ASSIGNMENT".equals(v.getContentType()) && v.getContentId().equals(assignment.getId())))
                    .count();
        }

        int completedLessons = (int) courseProgress.getLessonProgresses().stream()
                .filter(LessonProgress::getCompleted)
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
            if (courseProgress.getCompleteDate() == null) {
                courseProgress.setCompleteDate(new Date(System.currentTimeMillis()));
            }
        } else {
            courseProgress.setCompleted(false);
            courseProgress.setCompleteDate(null);
        }

        courseProgressRepository.save(courseProgress);
    }

    private String getCurrentUserId() {
        var context = SecurityContextHolder.getContext();
        return context.getAuthentication().getName();
    }
}