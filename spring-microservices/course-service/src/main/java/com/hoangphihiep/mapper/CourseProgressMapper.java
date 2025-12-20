package com.hoangphihiep.mapper;

import com.hoangphihiep.dto.response.CourseProgressResponse;
import com.hoangphihiep.dto.response.LessonProgressResponse;
import com.hoangphihiep.entity.CourseProgress;
import com.hoangphihiep.entity.LessonProgress;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring")
public interface CourseProgressMapper {

    @Mapping(target = "courseId", source = "course.id")
    @Mapping(target = "lessonProgresses", expression = "java(toLessonProgressResponseList(courseProgress.getLessonProgresses()))")
    CourseProgressResponse  toCourseProgressResponse(CourseProgress courseProgress);

    default LessonProgressResponse toLessonProgressResponse(LessonProgress lessonProgress) {
        if (lessonProgress == null) {
            return null;
        }

        return LessonProgressResponse.builder()
                .id(lessonProgress.getId())
                .lessonId(lessonProgress.getLesson().getId())
                .courseProgressId(lessonProgress.getCourseProgress().getId())
                .isCompleted(lessonProgress.getCompleted()) // SET TRỰC TIẾP
                .build();
    }

    default List<LessonProgressResponse> toLessonProgressResponseList(Set<LessonProgress> lessonProgresses) {
        if (lessonProgresses == null) {
            return List.of();
        }
        return lessonProgresses.stream()
                .map(lp -> {
                    System.out.println("Mapping lessonId=" + lp.getLesson().getId() +
                            ", isCompleted=" + lp.getCompleted()); // LOG ĐỂ XEM
                    return toLessonProgressResponse(lp);
                })
                .collect(Collectors.toList());
    }
}