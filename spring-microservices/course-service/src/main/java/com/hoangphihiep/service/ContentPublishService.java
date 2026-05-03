package com.hoangphihiep.service;

import com.hoangphihiep.dto.response.ContentPublishStatusResponse;
import com.hoangphihiep.entity.*;
import com.hoangphihiep.exception.AppException;
import com.hoangphihiep.exception.ErrorCode;
import com.hoangphihiep.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContentPublishService {

    private final CourseRepository courseRepository;
    private final SectionRepository sectionRepository;
    private final LessonRepository lessonRepository;
    private final QuizRepository quizRepository;
    private final AssignmentRepository assignmentRepository;

    @Transactional
    public void toggleSectionPublish(Integer sectionId, Boolean isPublished) {
        Section section = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new AppException(ErrorCode.SECTION_NOT_FOUND));

        section.setIsPublished(isPublished);
        section.setUpdateAt(new Date());

        sectionRepository.save(section);
    }

    @Transactional
    public void toggleLessonPublish(Integer lessonId, Boolean isPublished) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new AppException(ErrorCode.LESSON_NOT_FOUND));

        lesson.setIsPublished(isPublished);
        lesson.setUpdateAt(new Date());

        lessonRepository.save(lesson);
    }

    @Transactional
    public void toggleQuizPublish(Integer quizId, Boolean isPublished) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new AppException(ErrorCode.QUIZ_NOT_FOUND));

        quiz.setIsPublished(isPublished);
        quiz.setUpdateAt(new Date());

        quizRepository.save(quiz);
    }

    @Transactional
    public void toggleAssignmentPublish(Integer assignmentId, Boolean isPublished) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new AppException(ErrorCode.ASSIGNMENT_NOT_FOUND));

        assignment.setIsPublished(isPublished);
        assignment.setUpdateAt(new Date());

        assignmentRepository.save(assignment);
    }

    public ContentPublishStatusResponse getPublishStatus(Integer courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        int totalSections = course.getSections().size();
        int publishedSections = (int) course.getSections().stream()
                .filter(s -> Boolean.TRUE.equals(s.getIsPublished()))
                .count();

        int totalLessons = course.getSections().stream()
                .mapToInt(s -> s.getLessons().size())
                .sum();
        int publishedLessons = course.getSections().stream()
                .flatMap(s -> s.getLessons().stream())
                .filter(l -> Boolean.TRUE.equals(l.getIsPublished()))
                .mapToInt(l -> 1)
                .sum();

        int totalQuizzes = course.getSections().stream()
                .mapToInt(s -> s.getQuizs().size())
                .sum();
        int publishedQuizzes = course.getSections().stream()
                .flatMap(s -> s.getQuizs().stream())
                .filter(q -> Boolean.TRUE.equals(q.getIsPublished()))
                .mapToInt(q -> 1)
                .sum();

        int totalAssignments = course.getSections().stream()
                .mapToInt(s -> s.getAssignments().size())
                .sum();
        int publishedAssignments = course.getSections().stream()
                .flatMap(s -> s.getAssignments().stream())
                .filter(a -> Boolean.TRUE.equals(a.getIsPublished()))
                .mapToInt(a -> 1)
                .sum();

        return ContentPublishStatusResponse.builder()
                .courseId(courseId)
                .totalSections(totalSections)
                .publishedSections(publishedSections)
                .totalLessons(totalLessons)
                .publishedLessons(publishedLessons)
                .totalQuizzes(totalQuizzes)
                .publishedQuizzes(publishedQuizzes)
                .totalAssignments(totalAssignments)
                .publishedAssignments(publishedAssignments)
                .isPublished(null)
                .build();
    }

    @Transactional
    public ContentPublishStatusResponse publishAllContent(Integer courseId, Boolean isPublished) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        for (Section section : course.getSections()) {
            section.setIsPublished(isPublished);
            section.setUpdateAt(new Date());

            for (Lesson lesson : section.getLessons()) {
                lesson.setIsPublished(isPublished);
                lesson.setUpdateAt(new Date());
            }

            for (Quiz quiz : section.getQuizs()) {
                quiz.setIsPublished(isPublished);
                quiz.setUpdateAt(new Date());
            }

            for (Assignment assignment : section.getAssignments()) {
                assignment.setIsPublished(isPublished);
                assignment.setUpdateAt(new Date());
            }
        }

        courseRepository.save(course);
        return getPublishStatus(courseId);
    }

}