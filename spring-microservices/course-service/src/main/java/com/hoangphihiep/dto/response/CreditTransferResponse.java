package com.hoangphihiep.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CreditTransferResponse {
    private Integer id;
    private String studentId;
    private String studentName;
    
    // Source Course Info (From Student Request)
    private String sourceCourseName; // Can be derived from sourceCourseId or manually entered if generic
    private Integer sourceCourseId; // If linked to PublishedCourse
    
    // Target Course Info (Internal)
    private Integer targetCourseId;
    private String targetCourseName;
    
    // Equivalent Rule Info
    private Integer equivalentCourseId;
    private String equivalentCourseRequirements;
    private String equivalentCourseDescription;
    
    // Request Details
    private String description;
    private String attachmentUrl;
    private String status;
    private LocalDateTime requestDate;

    // Interview
    private String interviewTeacherId;
    private LocalDateTime interviewScheduledAt;
    private String interviewMode;
    private String interviewMeetingLink;
    private String interviewLocation;
    private String interviewFeedback;
    private LocalDateTime interviewScoredAt;

    // Decision
    private Double certificateScore;
    private Double interviewScore;
    private Double decisionScore;
    private Double certificateWeightApplied;
    private Double interviewWeightApplied;
    private Double approvalThresholdApplied;
    private String decisionReason;
    
    // Audit
    private String approvedById;
    private LocalDateTime approvedDate;
    private String rejectionReason;
}
