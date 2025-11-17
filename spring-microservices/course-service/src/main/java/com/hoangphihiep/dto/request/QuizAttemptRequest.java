package com.hoangphihiep.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizAttemptRequest {

    @NotBlank(message = "User ID is required")
    private String idUser;

    @NotNull(message = "Quiz ID is required")
    private Integer quizId;

    private Date submittedAt;

    private Integer timeSpent;

    private List<QuizAnswerRequest> answers;
}
