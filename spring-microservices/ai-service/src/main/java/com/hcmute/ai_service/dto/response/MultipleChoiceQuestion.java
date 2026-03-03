package com.hcmute.ai_service.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.util.List;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class MultipleChoiceQuestion extends BaseQuestion {
    private List<ChoiceOption> options;

    @Override
    @JsonProperty("question_type")
    public String getQuestionType() {
        return "MULTIPLE_CHOICE";
    }
}
