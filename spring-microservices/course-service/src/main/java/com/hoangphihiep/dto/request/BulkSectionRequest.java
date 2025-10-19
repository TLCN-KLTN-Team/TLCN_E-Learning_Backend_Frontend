package com.hoangphihiep.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkSectionRequest {

    @NotNull(message = "Course ID is required")
    private Integer courseId;

    @NotEmpty(message = "Sections list cannot be empty")
    @Valid
    private List<SectionRequest> sections;
}