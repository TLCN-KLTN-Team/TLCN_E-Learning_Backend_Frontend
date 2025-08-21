package com.hoangphihiep.mapper;

import com.hoangphihiep.dto.response.QuizResponse;
import com.hoangphihiep.entity.Quiz;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = QuestionMapper.class)
public interface QuizMapper {
    @Mapping(source = "section.title", target = "sectionName")
    @Mapping(source = "section.id", target = "sectionId")
    QuizResponse toQuizResponse(Quiz quiz);
}
