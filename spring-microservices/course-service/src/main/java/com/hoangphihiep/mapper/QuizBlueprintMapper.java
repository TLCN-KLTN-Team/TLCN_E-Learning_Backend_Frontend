package com.hoangphihiep.mapper;

import com.hoangphihiep.dto.response.QuizBlueprintResponse;
import com.hoangphihiep.entity.QuizBlueprint;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface QuizBlueprintMapper {

    @Mapping(source = "quiz.id", target = "quizId")
    @Mapping(source = "courseObjective.id", target = "cloId")
    @Mapping(source = "courseObjective.code", target = "cloCode")
    @Mapping(source = "courseObjective.description", target = "cloDescription")
    QuizBlueprintResponse toQuizBlueprintResponse(QuizBlueprint blueprint);

    List<QuizBlueprintResponse> toQuizBlueprintResponseList(List<QuizBlueprint> blueprints);
}