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
public class FillInTheBlankQuestion extends BaseQuestion {
    private List<BlankOption> options;

    @Override
    @JsonProperty("question_type")
    public String getQuestionType() {
        return "FILL_IN_THE_BLANK";
    }
}
