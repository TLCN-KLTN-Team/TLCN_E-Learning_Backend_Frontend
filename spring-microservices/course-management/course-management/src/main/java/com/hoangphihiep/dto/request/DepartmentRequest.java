package com.hoangphihiep.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DepartmentRequest {

    private Integer id;

    @NotBlank(message = "Department name is required")
    @Size(min = 2, max = 255, message = "Department name must be between 2 and 255 characters")
    private String name;

    @Size(max = 1000, message = "Department description cannot exceed 1000 characters")
    private String description;
}
