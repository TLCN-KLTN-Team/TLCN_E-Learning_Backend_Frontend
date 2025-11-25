package com.hoangphihiep.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentQuizAttemptResponse {
    private Integer attemptId;
    private Integer quizId;
    private String quizTitle;
    private String studentName;
    private LocalDateTime attemptDate;
    private Integer duration; // phút
    private Double score;
    private Double maxScore;
    private Boolean passed;
    private Integer questionsCorrect;
    private Integer totalQuestions;
}
