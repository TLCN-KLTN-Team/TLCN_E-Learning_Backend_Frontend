package com.hoangphihiep.dto.response;

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
public class QuizResultResponse {

    private Integer id;

    private String studentId;

    private String studentName;

    private String email;

    private Integer quizId;

    private String quizTitle;

    private String quizDescription;

    private Double score;

    private Double totalScore;

    private Double percentage;

    private Boolean isPassed;

    private Integer attemptNumber;

    private Date startedAt;

    private Date submittedAt;

    private Integer timeSpent; // in seconds

    private List<QuizAnswerResponse> answers;
}