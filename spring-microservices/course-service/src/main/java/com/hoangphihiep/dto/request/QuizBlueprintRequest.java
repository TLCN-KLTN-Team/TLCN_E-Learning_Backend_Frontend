package com.hoangphihiep.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizBlueprintRequest {

    @NotNull(message = "CLO id is required")
    private Integer cloId;

    @NotNull(message = "Percentage is required")
    @DecimalMin(value = "0.0", message = "Percentage must be >= 0")
    @DecimalMax(value = "100.0", message = "Percentage must be <= 100")
    private Double percentage;
}
