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
    CourseProgressResponse toCourseProgressResponse(CourseProgress courseProgress);

    @Mapping(target = "lessonId", source = "lesson.id")
    @Mapping(target = "courseProgressId", source = "courseProgress.id")
    LessonProgressResponse toLessonProgressResponse(LessonProgress lessonProgress);

    default List<LessonProgressResponse> toLessonProgressResponseList(Set<LessonProgress> lessonProgresses) {
        if (lessonProgresses == null) {
            return List.of();
        }
        return lessonProgresses.stream()
                .map(this::toLessonProgressResponse)
                .collect(Collectors.toList());
    }
}