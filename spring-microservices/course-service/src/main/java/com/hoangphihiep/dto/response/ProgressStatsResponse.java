package com.hoangphihiep.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProgressStatsResponse {
    private int totalLessons;
    private int completedLessons;
    private int totalQuizzes;
    private int completedQuizzes;
    private int totalAssignments;
    private int completedAssignments;
    private double overallProgress;
}