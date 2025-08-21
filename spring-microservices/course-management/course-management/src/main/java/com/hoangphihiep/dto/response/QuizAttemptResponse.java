package com.hoangphihiep.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizAttemptResponse {

    private Integer id;
    private String idUser;
    private Double score;
    private Double totalScore;
    private Boolean isPassed;
    private Date startedAt;
    private Date submittedAt;
    private Integer timeSpent;
    private Integer quizId;
    private String quizName;
    private Integer answersCount;
}
