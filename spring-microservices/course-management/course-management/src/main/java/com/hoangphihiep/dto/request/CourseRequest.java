package com.hoangphihiep.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseRequest {

    private Integer id;

    @NotBlank(message = "Course name is required")
    private String courseName;

    @NotNull(message = "Course type is required")
    private Integer courseTypeId;

    private String idTeacher;

    private String description;

    @Min(value = 1, message = "Credits must be at least 1")
    @Max(value = 10, message = "Credits cannot exceed 10")
    private Integer credits;

    @Min(value = 1, message = "Max students must be at least 1")
    @Max(value = 500, message = "Max students cannot exceed 500")
    private Integer maxStudents;

    private Date createdAt;

    private Date updateAt;

    private Set<SectionRequest> sections;
}
