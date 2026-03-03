package com.hcmute.ai_service.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.util.List;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@JsonTypeInfo(
    use = JsonTypeInfo.Id.NAME,
    include = JsonTypeInfo.As.PROPERTY,
    property = "question_type"
)
@JsonSubTypes({
    @JsonSubTypes.Type(value = SingleChoiceQuestion.class, name = "SINGLE_CHOICE"),
    @JsonSubTypes.Type(value = MultipleChoiceQuestion.class, name = "MULTIPLE_CHOICE"),
    @JsonSubTypes.Type(value = TrueFalseQuestion.class, name = "TRUE_FALSE"),
    @JsonSubTypes.Type(value = FillInTheBlankQuestion.class, name = "FILL_IN_THE_BLANK")
})
public abstract class BaseQuestion {
    private String question;
    private String difficulty;
    private Float score;
    private List<String> tags;

    @JsonProperty("question_type")
    public abstract String getQuestionType();
}
