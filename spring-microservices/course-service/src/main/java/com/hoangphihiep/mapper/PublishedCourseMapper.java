// ============================================
// PublishedCourseMapper.java
// ============================================
package com.hoangphihiep.mapper;

import com.hoangphihiep.dto.response.CourseDetailResponse;
import com.hoangphihiep.dto.response.PublishedCourseResponse;
import com.hoangphihiep.entity.CourseDetail;
import com.hoangphihiep.entity.PublishedCourse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class PublishedCourseMapper {

    private final CourseMapper courseMapper;
    private final CourseTypeMapper courseTypeMapper;
    private final SectionMapper sectionMapper;

    public PublishedCourseResponse toPublishedCourseResponse(PublishedCourse publishedCourse) {
        if (publishedCourse == null) {
            return null;
        }

        // Lọc các section được publish
        var publishedSections = publishedCourse.getCourse().getSections().stream()
                .filter(section -> Boolean.TRUE.equals(section.getIsPublished()))
                .map(sectionMapper::toSectionResponse)
                .collect(Collectors.toList());

        // Đếm số lượng lesson, quiz, assignment được publish
        int totalLessons = publishedSections.stream()
                .mapToInt(section -> (int) section.getLessons().stream()
                        .filter(lesson -> Boolean.TRUE.equals(lesson.getIsPublished()))
                        .count())
                .sum();

        int totalQuizzes = publishedSections.stream()
                .mapToInt(section -> (int) section.getQuizs().stream()
                        .filter(quiz -> Boolean.TRUE.equals(quiz.getIsPublished()))
                        .count())
                .sum();

        int totalAssignments = publishedSections.stream()
                .mapToInt(section -> (int) section.getAssignments().stream()
                        .filter(assignment -> Boolean.TRUE.equals(assignment.getIsPublished()))
                        .count())
                .sum();

        return PublishedCourseResponse.builder()
                .id(publishedCourse.getId())
                .course(courseMapper.toCourseResponse(publishedCourse.getCourse()))
                .courseDetail(toCourseDetailResponse(publishedCourse.getCourseDetail()))
                .courseType(courseTypeMapper.toCourseTypeResponse(publishedCourse.getCourseType()))
                .coursePrice(publishedCourse.getCoursePrice())
                .status(publishedCourse.getStatus())
                .statusText(getStatusText(publishedCourse.getStatus()))
                .createdAt(publishedCourse.getCreatedAt())
                .updatedAt(publishedCourse.getUpdatedAt())
                .publishedSections(publishedSections)
                .totalPublishedLessons(totalLessons)
                .totalPublishedQuizzes(totalQuizzes)
                .totalPublishedAssignments(totalAssignments)
                .build();
    }

    private CourseDetailResponse toCourseDetailResponse(CourseDetail courseDetail) {
        if (courseDetail == null) {
            return null;
        }

        return CourseDetailResponse.builder()
                .id(courseDetail.getId())
                .description(courseDetail.getDescription())
                .courseIntroduction(courseDetail.getCourseIntroduction())
                .courseImage(courseDetail.getCourseImage())
                .courseVideo(courseDetail.getCourseVideo())
                .learnerAchievements(courseDetail.getLearnerAchievements())
                .courseLearner(courseDetail.getCourseLearner())
                .courseTarget(courseDetail.getCourseTarget())
                .build();
    }

    private String getStatusText(Integer status) {
        if (status == null) return "Unknown";

        return switch (status) {
            case 0 -> "Draft";
            case 1 -> "Pending Approval";
            case 2 -> "Approved";
            case 3 -> "Rejected";
            default -> "Unknown";
        };
    }
}