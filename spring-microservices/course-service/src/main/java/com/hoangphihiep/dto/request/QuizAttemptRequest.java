package com.hoangphihiep.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizAttemptRequest {

    @NotBlank(message = "User ID is required")
    private String idUser;

    @NotNull(message = "Quiz ID is required")
    private Integer quizId;

    private Double score;
    private Double totalScore;
    private Boolean isPassed;
    private Date submittedAt;
    private Integer timeSpent;
}
