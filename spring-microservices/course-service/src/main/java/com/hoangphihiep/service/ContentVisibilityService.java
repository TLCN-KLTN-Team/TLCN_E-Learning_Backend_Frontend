package com.hoangphihiep.service;

import com.hoangphihiep.dto.request.ContentVisibilityRequest;
import com.hoangphihiep.dto.response.ContentVisibilityResponse;
import com.hoangphihiep.entity.*;
import com.hoangphihiep.exception.AppException;
import com.hoangphihiep.exception.ErrorCode;
import com.hoangphihiep.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContentVisibilityService {

    private final ClassContentVisibilityRepository visibilityRepository;
    private final CourseClassRepository classRepository;
    private final SectionRepository sectionRepository;
    private final LessonRepository lessonRepository;
    private final QuizRepository quizRepository;
    private final AssignmentRepository assignmentRepository;

    @Transactional
    public void updateSectionVisibility(Integer sectionId, List<Integer> visibleClassIds) {
        Section section = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new AppException(ErrorCode.SECTION_NOT_FOUND));

        // Xóa tất cả visibility cũ của section này
        visibilityRepository.deleteByContentTypeAndContentId("SECTION", sectionId);

        // Tạo visibility mới cho các lớp được chọn
        if (visibleClassIds != null && !visibleClassIds.isEmpty()) {
            List<ClassContentVisibility> visibilities = new ArrayList<>();

            for (Integer classId : visibleClassIds) {
                CourseClass courseClass = classRepository.findById(classId)
                        .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));

                ClassContentVisibility visibility = ClassContentVisibility.builder()
                        .courseClass(courseClass)
                        .contentType("SECTION")
                        .contentId(sectionId)
                        .isVisible(true)
                        .build();

                visibilities.add(visibility);
            }

            visibilityRepository.saveAll(visibilities);
            log.info("Updated visibility for section {} to {} classes", sectionId, visibleClassIds.size());
        }
    }

    public ContentVisibilityResponse getSectionVisibility(Integer courseId, Integer sectionId) {
        Section section = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new AppException(ErrorCode.SECTION_NOT_FOUND));

        // Lấy tất cả lớp của khóa học
        List<CourseClass> allClasses = classRepository.findByCourseId(courseId);

        // Lấy visibility hiện tại
        List<ClassContentVisibility> visibilities =
                visibilityRepository.findByContentTypeAndContentId("SECTION", sectionId);

        // Map visibility info
        List<ContentVisibilityResponse.ClassVisibilityInfo> classVisibilities =
                allClasses.stream().map(courseClass -> {
                    boolean isVisible = visibilities.stream()
                            .anyMatch(v -> v.getCourseClass().getId().equals(courseClass.getId()) && v.getIsVisible());

                    Date updatedAt = visibilities.stream()
                            .filter(v -> v.getCourseClass().getId().equals(courseClass.getId()))
                            .findFirst()
                            .map(ClassContentVisibility::getUpdatedAt)
                            .orElse(null);

                    return ContentVisibilityResponse.ClassVisibilityInfo.builder()
                            .classId(Math.toIntExact(courseClass.getId()))
                            .className(courseClass.getClassName())
                            .isVisible(isVisible)
                            .updatedAt(updatedAt)
                            .build();
                }).collect(Collectors.toList());

        return ContentVisibilityResponse.builder()
                .contentType("SECTION")
                .contentId(sectionId)
                .contentTitle(section.getTitle())
                .classVisibilities(classVisibilities)
                .build();
    }

    @Transactional
    public void updateLessonVisibility(Integer lessonId, List<Integer> visibleClassIds) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new AppException(ErrorCode.LESSON_NOT_FOUND));

        // Xóa tất cả visibility cũ của lesson này
        visibilityRepository.deleteByContentTypeAndContentId("LESSON", lessonId);

        // Tạo visibility mới cho các lớp được chọn
        if (visibleClassIds != null && !visibleClassIds.isEmpty()) {
            List<ClassContentVisibility> visibilities = new ArrayList<>();

            for (Integer classId : visibleClassIds) {
                CourseClass courseClass = classRepository.findById(classId)
                        .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));

                ClassContentVisibility visibility = ClassContentVisibility.builder()
                        .courseClass(courseClass)
                        .contentType("LESSON")
                        .contentId(lessonId)
                        .isVisible(true)
                        .build();

                visibilities.add(visibility);
            }

            visibilityRepository.saveAll(visibilities);
            log.info("Updated visibility for lesson {} to {} classes", lessonId, visibleClassIds.size());
        }
    }

    public ContentVisibilityResponse getLessonVisibility(Integer courseId, Integer lessonId) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new AppException(ErrorCode.LESSON_NOT_FOUND));

        // Lấy tất cả lớp của khóa học
        List<CourseClass> allClasses = classRepository.findByCourseId(courseId);

        // Lấy visibility hiện tại
        List<ClassContentVisibility> visibilities =
                visibilityRepository.findByContentTypeAndContentId("LESSON", lessonId);

        // Map visibility info
        List<ContentVisibilityResponse.ClassVisibilityInfo> classVisibilities =
                allClasses.stream().map(courseClass -> {
                    boolean isVisible = visibilities.stream()
                            .anyMatch(v -> v.getCourseClass().getId().equals(courseClass.getId()) && v.getIsVisible());

                    Date updatedAt = visibilities.stream()
                            .filter(v -> v.getCourseClass().getId().equals(courseClass.getId()))
                            .findFirst()
                            .map(ClassContentVisibility::getUpdatedAt)
                            .orElse(null);

                    return ContentVisibilityResponse.ClassVisibilityInfo.builder()
                            .classId(Math.toIntExact(courseClass.getId()))
                            .className(courseClass.getClassName())
                            .isVisible(isVisible)
                            .updatedAt(updatedAt)
                            .build();
                }).collect(Collectors.toList());

        return ContentVisibilityResponse.builder()
                .contentType("LESSON")
                .contentId(lessonId)
                .contentTitle(lesson.getTitle())
                .classVisibilities(classVisibilities)
                .build();
    }

    @Transactional
    public void updateQuizVisibility(Integer quizId, List<Integer> visibleClassIds) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new AppException(ErrorCode.QUIZ_NOT_FOUND));

        // Xóa tất cả visibility cũ của quiz này
        visibilityRepository.deleteByContentTypeAndContentId("QUIZ", quizId);

        // Tạo visibility mới cho các lớp được chọn
        if (visibleClassIds != null && !visibleClassIds.isEmpty()) {
            List<ClassContentVisibility> visibilities = new ArrayList<>();

            for (Integer classId : visibleClassIds) {
                CourseClass courseClass = classRepository.findById(classId)
                        .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));

                ClassContentVisibility visibility = ClassContentVisibility.builder()
                        .courseClass(courseClass)
                        .contentType("QUIZ")
                        .contentId(quizId)
                        .isVisible(true)
                        .build();

                visibilities.add(visibility);
            }

            visibilityRepository.saveAll(visibilities);
            log.info("Updated visibility for quiz {} to {} classes", quizId, visibleClassIds.size());
        }
    }

    public ContentVisibilityResponse getQuizVisibility(Integer courseId, Integer quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new AppException(ErrorCode.QUIZ_NOT_FOUND));

        // Lấy tất cả lớp của khóa học
        List<CourseClass> allClasses = classRepository.findByCourseId(courseId);

        // Lấy visibility hiện tại
        List<ClassContentVisibility> visibilities =
                visibilityRepository.findByContentTypeAndContentId("QUIZ", quizId);

        // Map visibility info
        List<ContentVisibilityResponse.ClassVisibilityInfo> classVisibilities =
                allClasses.stream().map(courseClass -> {
                    boolean isVisible = visibilities.stream()
                            .anyMatch(v -> v.getCourseClass().getId().equals(courseClass.getId()) && v.getIsVisible());

                    Date updatedAt = visibilities.stream()
                            .filter(v -> v.getCourseClass().getId().equals(courseClass.getId()))
                            .findFirst()
                            .map(ClassContentVisibility::getUpdatedAt)
                            .orElse(null);

                    return ContentVisibilityResponse.ClassVisibilityInfo.builder()
                            .classId(Math.toIntExact(courseClass.getId()))
                            .className(courseClass.getClassName())
                            .isVisible(isVisible)
                            .updatedAt(updatedAt)
                            .build();
                }).collect(Collectors.toList());

        return ContentVisibilityResponse.builder()
                .contentType("QUIZ")
                .contentId(quizId)
                .contentTitle(quiz.getTitle())
                .classVisibilities(classVisibilities)
                .build();
    }

    @Transactional
    public void updateAssignmentVisibility(Integer assignmentId, List<Integer> visibleClassIds) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new AppException(ErrorCode.ASSIGNMENT_NOT_FOUND));

        // Xóa tất cả visibility cũ của assignment này
        visibilityRepository.deleteByContentTypeAndContentId("ASSIGNMENT", assignmentId);

        // Tạo visibility mới cho các lớp được chọn
        if (visibleClassIds != null && !visibleClassIds.isEmpty()) {
            List<ClassContentVisibility> visibilities = new ArrayList<>();

            for (Integer classId : visibleClassIds) {
                CourseClass courseClass = classRepository.findById(classId)
                        .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));

                ClassContentVisibility visibility = ClassContentVisibility.builder()
                        .courseClass(courseClass)
                        .contentType("ASSIGNMENT")
                        .contentId(assignmentId)
                        .isVisible(true)
                        .build();

                visibilities.add(visibility);
            }

            visibilityRepository.saveAll(visibilities);
            log.info("Updated visibility for assignment {} to {} classes", assignmentId, visibleClassIds.size());
        }
    }

    public ContentVisibilityResponse getAssignmentVisibility(Integer courseId, Integer assignmentId) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new AppException(ErrorCode.ASSIGNMENT_NOT_FOUND));

        // Lấy tất cả lớp của khóa học
        List<CourseClass> allClasses = classRepository.findByCourseId(courseId);

        // Lấy visibility hiện tại
        List<ClassContentVisibility> visibilities =
                visibilityRepository.findByContentTypeAndContentId("ASSIGNMENT", assignmentId);

        // Map visibility info
        List<ContentVisibilityResponse.ClassVisibilityInfo> classVisibilities =
                allClasses.stream().map(courseClass -> {
                    boolean isVisible = visibilities.stream()
                            .anyMatch(v -> v.getCourseClass().getId().equals(courseClass.getId()) && v.getIsVisible());

                    Date updatedAt = visibilities.stream()
                            .filter(v -> v.getCourseClass().getId().equals(courseClass.getId()))
                            .findFirst()
                            .map(ClassContentVisibility::getUpdatedAt)
                            .orElse(null);

                    return ContentVisibilityResponse.ClassVisibilityInfo.builder()
                            .classId(Math.toIntExact(courseClass.getId()))
                            .className(courseClass.getClassName())
                            .isVisible(isVisible)
                            .updatedAt(updatedAt)
                            .build();
                }).collect(Collectors.toList());

        return ContentVisibilityResponse.builder()
                .contentType("ASSIGNMENT")
                .contentId(assignmentId)
                .contentTitle(assignment.getTitle())
                .classVisibilities(classVisibilities)
                .build();
    }
}