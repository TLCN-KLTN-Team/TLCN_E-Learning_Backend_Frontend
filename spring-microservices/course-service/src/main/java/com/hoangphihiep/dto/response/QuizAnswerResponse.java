package com.hoangphihiep.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizAnswerResponse {

    private Integer id;

    private Integer questionId;

    private String questionText;

    private String questionType; // SINGLE_CHOICE, MULTIPLE_CHOICE, TRUE_FALSE

    private Double questionScore;

    private List<Integer> selectedAnswerIds;

    private List<AnswerOptionResponse> selectedAnswers;

    private List<Integer> correctAnswerIds;

    private List<AnswerOptionResponse> correctAnswers;

    private Boolean isCorrect;

    private Double pointsAwarded;

    private LocalDateTime answeredAt;
}