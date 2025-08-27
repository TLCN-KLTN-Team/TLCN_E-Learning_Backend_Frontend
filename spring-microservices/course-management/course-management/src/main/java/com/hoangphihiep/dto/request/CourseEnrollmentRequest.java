package com.hoangphihiep.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseEnrollmentRequest {

    @NotNull(message = "Course ID is required")
    private Integer courseId;

    @NotEmpty(message = "Student IDs list cannot be empty")
    private List<String> studentIds;
}

