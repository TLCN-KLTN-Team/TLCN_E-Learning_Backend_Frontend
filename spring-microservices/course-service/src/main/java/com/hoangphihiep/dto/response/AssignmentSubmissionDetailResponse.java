package com.hoangphihiep.dto.response;

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
public class AssignmentSubmissionDetailResponse {

    private Integer id;

    private Integer assignmentId;

    private String assignmentTitle;

    private String assignmentDescription;

    private Integer maxScore;

    private Date deadline;

    private String studentId;

    private String studentName;

    private String studentEmail;

    private String submissionText;

    private List<String> submissionFiles;

    private String submissionLink;

    private Date submittedAt;

    private Double score;

    private String feedback;

    private Date gradedAt;

    private String status;

    private Boolean isLate;

    private Long hoursLate;
}