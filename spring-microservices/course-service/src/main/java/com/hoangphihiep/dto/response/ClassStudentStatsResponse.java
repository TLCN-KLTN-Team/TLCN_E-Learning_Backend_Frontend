package com.hoangphihiep.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassStudentStatsResponse {
    private Integer totalStudents;
    private Integer activeStudents;
    private Double averageScore;
    private Double completionRate;
}