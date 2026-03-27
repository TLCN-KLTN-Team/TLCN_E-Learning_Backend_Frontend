package com.hoangphihiep.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseObjectiveRequest {

    @NotBlank(message = "CLO code is required")
    private String code;

    private String description;
}
