package com.hoangphihiep.dto.request;

import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizAnswerRequest {
    private Integer questionId;
    private Integer selectedAnswerId; // For single choice & true/false
    private List<Integer> selectedAnswerIds; // For multiple choice
    private String answerText; // For essay questions
}