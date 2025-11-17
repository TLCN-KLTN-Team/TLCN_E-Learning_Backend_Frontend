package com.hoangphihiep.dto.request;

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
public class AssignmentSubmissionRequest {

    private Integer id;

    @NotNull(message = "Assignment ID is required")
    private Integer assignmentId;

    private String idUser;

    private String submissionText;

    private List<String> submissionFiles; // URLs của file đã upload

    private String submissionLink;

    private Date submittedAt;
}