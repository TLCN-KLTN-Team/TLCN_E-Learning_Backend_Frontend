package com.hoangphihiep.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignmentRequest {

    private Integer id;

    @NotNull(message = "Section ID is required")
    private Integer sectionId;

    @NotBlank(message = "Assignment title is required")
    private String title;

    private String description;

    @NotNull(message = "Deadline is required")
    private Date deadline;

    private List<String> assignmentFiles;

    @NotBlank(message = "Submission type is required")
    private String submissionType;

    private List<String> rubricFiles;

    private Integer maxScore;

    private Integer numberItem;

    private Boolean isPublished;

    private Date createdAt;

    private Date updateAt;
}