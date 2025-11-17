package com.hoangphihiep.dto.response;

import lombok.*;
import java.util.Date;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizAttemptResponse {
    private Integer id;
    private String userId;
    private Integer quizId;
    private Double score;
    private Double totalScore;
    private Boolean isPassed;
    private Date startedAt;
    private Date submittedAt;
    private Integer timeSpent;
    private List<QuizAttemptAnswerResponse> answers;
}