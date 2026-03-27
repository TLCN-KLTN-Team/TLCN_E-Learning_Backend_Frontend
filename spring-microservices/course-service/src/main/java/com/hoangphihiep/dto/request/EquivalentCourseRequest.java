package com.hoangphihiep.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class EquivalentCourseRequest {
    @NotNull(message = "Source course ID is required")
    private Integer sourceCourseId;

    @NotNull(message = "Target course ID is required")
    private Integer targetCourseId;
    
    private String requirements;
    private String description;
    
    private Boolean status;
    private LocalDateTime validFrom;
    private LocalDateTime validUntil;

    private Double minQuizScore;
    private Double minAssignmentScore;
    private String requiredRank;

    private Double certificateWeight;
    private Double interviewWeight;
    private Double approvalThreshold;
}
