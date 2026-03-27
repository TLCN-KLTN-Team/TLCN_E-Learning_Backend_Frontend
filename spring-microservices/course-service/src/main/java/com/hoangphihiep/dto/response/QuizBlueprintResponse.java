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
public class QuizBlueprintResponse {
    private Integer id;
    private Integer quizId;
    private Integer cloId;
    private String cloCode;
    private String cloDescription;
    private Double percentage;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
