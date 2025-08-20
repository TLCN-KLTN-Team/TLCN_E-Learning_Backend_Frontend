package com.hoangphihiep.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseRequest {

    private Integer id;

    private String courseName;

    private Integer courseTypeId;

    private Double coursePrice;

    private Boolean visibility = true;

    private Boolean isApproved;

    private String idTeacher;

    private Integer status = 1;

    @Valid
    @NotEmpty(message = "Sections list cannot be empty")
    private Set<SectionRequest> sections;
}
