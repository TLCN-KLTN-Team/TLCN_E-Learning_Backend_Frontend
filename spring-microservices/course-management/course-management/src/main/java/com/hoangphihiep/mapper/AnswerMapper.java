package com.hoangphihiep.mapper;

import com.hoangphihiep.dto.response.AnswerResponse;
import com.hoangphihiep.entity.Answer;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface AnswerMapper {
    AnswerResponse toAnswerResponse(Answer answer);
}
