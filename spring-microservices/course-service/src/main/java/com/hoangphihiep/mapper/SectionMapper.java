package com.hoangphihiep.mapper;

import com.hoangphihiep.dto.response.SectionResponse;
import com.hoangphihiep.entity.Section;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = { QuizMapper.class, LessonMapper.class })
public interface SectionMapper {

    @Mapping(source = "course.id", target = "courseId")
    @Mapping(source = "course.courseName", target = "courseName")
    SectionResponse toSectionResponse(Section section);
}
