package com.hoangphihiep.dto.response;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizAttemptAnswerResponse {
    private Integer id;
    private Integer questionId;
    private Integer selectedAnswerId;
    private List<Integer> selectedAnswerIds;
    private String answerText;
    private Boolean isCorrect;
    private Double pointsAwarded;
    private LocalDateTime answeredAt;
}