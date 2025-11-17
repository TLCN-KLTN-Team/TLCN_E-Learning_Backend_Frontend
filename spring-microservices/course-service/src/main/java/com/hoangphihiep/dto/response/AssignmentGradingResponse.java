package com.hoangphihiep.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignmentGradingResponse {

    private String studentId;

    private String studentName;

    private String email;

    private Integer totalAssignments;

    private Integer submittedAssignments;

    private Integer gradedAssignments;

    private Integer pendingAssignments;

    private Integer averageScore;

    private List<AssignmentSubmissionResponse> latestSubmissions;
}
