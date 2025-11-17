package com.hoangphihiep.dto.response;

import lombok.*;
import java.util.Date;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizAttemptHistoryResponse {
    private Integer attemptNumber;
    private Double score;
    private Double totalScore;
    private Boolean isPassed;
    private Date submittedAt;
    private Integer timeSpent;
}