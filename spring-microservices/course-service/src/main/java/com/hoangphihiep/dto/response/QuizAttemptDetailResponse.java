package com.hoangphihiep.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizAttemptDetailResponse {
    private Integer attemptId;
    private String quizTitle;
    private String studentName;
    private Double score;
    private Double maxScore;
    private Boolean passed;
    private Integer duration;
    private List<QuestionAnswerDetail> questions;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionAnswerDetail {
        private Integer questionId;
        private String questionText;
        private String questionType; // SINGLE_CHOICE, MULTIPLE_CHOICE
        private List<String> options;
        private List<Integer> correctAnswers; // Index của đáp án đúng
        private List<Integer> studentAnswers; // Index đáp án học viên chọn
        private Boolean isCorrect;
        private Double points;
    }
}
