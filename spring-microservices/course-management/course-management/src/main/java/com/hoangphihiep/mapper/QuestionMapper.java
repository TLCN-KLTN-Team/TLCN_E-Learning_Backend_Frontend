package com.hoangphihiep.mapper;

import com.hoangphihiep.dto.response.QuestionResponse;
import com.hoangphihiep.entity.Question;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring", uses = AnswerMapper.class)
public interface QuestionMapper {
    QuestionResponse toQuestionResponse(Question question);
}
