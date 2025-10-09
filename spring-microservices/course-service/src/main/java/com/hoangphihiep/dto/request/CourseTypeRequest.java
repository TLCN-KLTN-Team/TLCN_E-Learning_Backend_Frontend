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
public class CourseTypeRequest {

    @NotBlank(message = "Course type name is required")
    private String courseTypeName;

    private String description;
}
