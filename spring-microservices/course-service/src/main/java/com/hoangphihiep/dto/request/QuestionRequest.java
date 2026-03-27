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

    private Integer quizId; // Made optional for library questions

    @NotBlank(message = "Question text is required")
    private String questionText;

    @NotBlank(message = "Question type is required")
    private String questionType; // MULTIPLE_CHOICE, TRUE_FALSE, SHORT_ANSWER, ESSAY

    private Integer orderIndex;

    private List<String> attachments;

    @NotNull(message = "Score is required")
    private Double score;

    // Library question fields
    private String difficultyLevel; // EASY, MEDIUM, HARD
    private String tags; // Comma-separated tags
    private Integer educationalUnitId;
    @NotNull(message = "CLO id is required")
    private Integer cloId;

    private Date createdAt;

    private Date updateAt;

    @Valid
    private Set <AnswerRequest> answers;
}
