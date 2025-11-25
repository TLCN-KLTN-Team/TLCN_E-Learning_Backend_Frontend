package com.hoangphihiep.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentAssignmentSubmissionResponse {
    private Integer submissionId;
    private Integer assignmentId;
    private String assignmentTitle;
    private String studentName;
    private LocalDateTime submittedDate;
    private LocalDateTime deadline;
    private String content;
    private List<String> files; // URL của các file
    private String link;
    private Double score;
    private Double maxScore;
    private String feedback;
    private String status; // "pending" hoặc "graded"
    private Boolean isLate; // Nộp trễ hay không
}
