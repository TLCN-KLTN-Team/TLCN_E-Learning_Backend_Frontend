// ============================================
// PublishedCourseMapper.java
// ============================================
package com.hoangphihiep.mapper;

import com.hoangphihiep.dto.response.CourseResponse;
import com.hoangphihiep.dto.response.PublishedCourseResponse;
import com.hoangphihiep.entity.PublishedCourse;
import com.hoangphihiep.repository.httpclient.TeacherRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class PublishedCourseMapper {

    private final CourseMapper courseMapper;
    private final CourseTypeMapper courseTypeMapper;
    private final SectionMapper sectionMapper;
    private final TeacherRepository teacherRepository;

    public PublishedCourseResponse toPublishedCourseResponse(PublishedCourse publishedCourse) {
        if (publishedCourse == null) {
            return null;
        }

        // Lọc các section được publish và chỉ lấy content đã published
        var publishedSections = publishedCourse.getCourse().getSections().stream()
                .filter(section -> Boolean.TRUE.equals(section.getIsPublished()))
                .map(section -> {
                    // Map section và filter content đã published
                    var sectionResponse = sectionMapper.toSectionResponse(section);
                    
                    // Filter chỉ lấy lessons đã published
                    var publishedLessons = sectionResponse.getLessons().stream()
                            .filter(lesson -> Boolean.TRUE.equals(lesson.getIsPublished()))
                            .collect(Collectors.toSet());
                    sectionResponse.setLessons(publishedLessons);
                    
                    // Filter chỉ lấy quizzes đã published
                    var publishedQuizzes = sectionResponse.getQuizs().stream()
                            .filter(quiz -> Boolean.TRUE.equals(quiz.getIsPublished()))
                            .collect(Collectors.toSet());
                    sectionResponse.setQuizs(publishedQuizzes);
                    
                    // Filter chỉ lấy assignments đã published
                    var publishedAssignments = sectionResponse.getAssignments().stream()
                            .filter(assignment -> Boolean.TRUE.equals(assignment.getIsPublished()))
                            .collect(Collectors.toSet());
                    sectionResponse.setAssignments(publishedAssignments);
                    
                    return sectionResponse;
                })
                .collect(Collectors.toList());

        // Đếm số lượng lesson, quiz, assignment được publish
        int totalLessons = publishedSections.stream()
                .mapToInt(section -> section.getLessons().size())
                .sum();

        int totalQuizzes = publishedSections.stream()
                .mapToInt(section -> section.getQuizs().size())
                .sum();

        int totalAssignments = publishedSections.stream()
                .mapToInt(section -> section.getAssignments().size())
                .sum();

        // Map course và enrich với teacher info
        CourseResponse courseResponse = courseMapper.toCourseResponse(publishedCourse.getCourse());
        enrichTeacherInfo(courseResponse, publishedCourse.getCourse().getIdTeacher());

        return PublishedCourseResponse.builder()
                .id(publishedCourse.getId())
                .course(courseResponse)
                .courseName(publishedCourse.getCourseName())
                .authorName(publishedCourse.getAuthorName())
                .courseType(courseTypeMapper.toCourseTypeResponse(publishedCourse.getCourseType()))
                .description(publishedCourse.getDescription())
                .courseIntroduction(publishedCourse.getCourseIntroduction())
                .courseImage(publishedCourse.getCourseImage())
                .courseVideo(publishedCourse.getCourseVideo())
                .learnerAchievements(publishedCourse.getLearnerAchievements())
                .courseLearner(publishedCourse.getCourseLearner())
                .courseTarget(publishedCourse.getCourseTarget())
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

    private void enrichTeacherInfo(CourseResponse courseResponse, String teacherId) {
        if (teacherId != null && !teacherId.isEmpty()) {
            try {
                log.debug("Fetching teacher info for userId: {}", teacherId);
                var teacherApiResponse = teacherRepository.getTeacherByTeacherId(teacherId);
                if (teacherApiResponse != null && teacherApiResponse.getResult() != null) {
                    courseResponse.setTeacher(teacherApiResponse.getResult());
                    log.debug("Successfully fetched teacher: {} {}", 
                            teacherApiResponse.getResult().getFirstName(),
                            teacherApiResponse.getResult().getLastName());
                } else {
                    log.warn("Teacher API returned null for userId: {}", teacherId);
                }
            } catch (Exception e) {
                log.error("Failed to fetch teacher info for userId: {}. Error: {}", 
                        teacherId, e.getMessage());
                // Không throw exception, response vẫn trả về với teacher = null
            }
        }
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
