package com.hoangphihiep.mapper;

import com.hoangphihiep.dto.response.LessonResponse;
import com.hoangphihiep.entity.Lesson;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface LessonMapper {

    @Mapping(source = "section.title", target = "sectionName")
    @Mapping(source = "section.id", target = "sectionId")
    LessonResponse toLessonResponse (Lesson lesson);

    @Mapping(source = "section.title", target = "sectionName")
    @Mapping(source = "section.id", target = "sectionId")
    List<LessonResponse> toListLessonResponse (List<Lesson> lessons);

}
