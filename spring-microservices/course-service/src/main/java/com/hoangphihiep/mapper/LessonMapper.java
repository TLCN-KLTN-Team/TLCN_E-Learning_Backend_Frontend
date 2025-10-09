package com.hoangphihiep.mapper;

import com.hoangphihiep.dto.response.LessonResponse;
import com.hoangphihiep.entity.Lesson;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface LessonMapper {

    @Mapping(source = "section.title", target = "sectionName")
    @Mapping(source = "section.id", target = "sectionId")
    LessonResponse toLessonResponse (Lesson lesson);
}
