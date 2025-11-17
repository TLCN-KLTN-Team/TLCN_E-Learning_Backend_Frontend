package com.hoangphihiep.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizStatisticsResponse {

    private Integer totalQuizzes;

    private Integer totalAttempts;

    private Integer passedAttempts;

    private Integer failedAttempts;

    private Double averageScore;

    private Double averagePercentage;

    private Double highestScore;

    private Double lowestScore;
}
