package com.hoangphihiep.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.List;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionRequest {

    private Integer id;

    @NotNull(message = "Quiz ID is required")
    private Integer quizId;

    @NotBlank(message = "Question text is required")
    private String questionText;

    @NotBlank(message = "Question type is required")
    private String questionType;

    private Integer orderIndex;

    private List<String> attachments;

    @NotNull(message = "Score is required")
    private Double score;

    private Date createdAt;

    private Date updateAt;

    @Valid
    private Set <AnswerRequest> answers;
}
