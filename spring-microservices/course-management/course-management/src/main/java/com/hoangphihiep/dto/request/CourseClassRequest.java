package com.hoangphihiep.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseClassRequest {

    @NotBlank(message = "Class name is required")
    private String className;

    @NotBlank(message = "Class code is required")
    private String classCode;

    @NotNull(message = "Course ID is required")
    private Integer courseId;

    @Positive(message = "Max students must be positive")
    private Integer maxStudents;

    private Date startDate;

    private Date endDate;

    private String description;
}