package com.hoangphihiep.mapper;

import com.hoangphihiep.dto.response.SectionResponse;
import com.hoangphihiep.entity.Section;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = { QuizMapper.class, LessonMapper.class })
public interface SectionMapper {

    @Mapping(source = "course.id", target = "courseId")
    @Mapping(source = "course.courseName", target = "courseName")
    @Mapping(source = "lessons", target = "lessons")
    @Mapping(source = "quizs", target = "quizs")
    @Mapping(source = "assignments", target = "assignments")
    SectionResponse toSectionResponse(Section section);
}
