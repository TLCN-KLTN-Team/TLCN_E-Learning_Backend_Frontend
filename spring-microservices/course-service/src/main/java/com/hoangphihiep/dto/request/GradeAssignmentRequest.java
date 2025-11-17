package com.hoangphihiep.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GradeAssignmentRequest {

    @NotNull(message = "Submission ID is required")
    private Integer submissionId;

    @NotNull(message = "Score is required")
    @Min(value = 0, message = "Score must be at least 0")
    private Double score;

    @Size(max = 2000, message = "Feedback must not exceed 2000 characters")
    private String feedback;
}
