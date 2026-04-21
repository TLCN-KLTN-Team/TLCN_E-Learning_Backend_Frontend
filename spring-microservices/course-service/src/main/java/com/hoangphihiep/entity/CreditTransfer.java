package com.hoangphihiep.entity;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;

import com.hoangphihiep.utils.CreditTransferStatus;
import com.hoangphihiep.utils.InterviewMode;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Table(name = "credit_transfer")
public class CreditTransfer implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "student_id")
    private String idStudent;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "equivalent_course_id")
    private EquivalentCourse equivalentCourse;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "student_name")
    private String studentName;

    @Column(name = "educational_unit_name")
    private String educationalUnitName;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 50)
    private CreditTransferStatus status;

    @Column(name = "request_date")
    private LocalDateTime requestDate;

    @Column(name = "approved_by")
    private String approvedById;

    @Column(name = "approved_date")
    private LocalDateTime approvedDate;

    @Column(name = "interview_teacher_id")
    private String interviewTeacherId;

    @Column(name = "interview_scheduled_at")
    private LocalDateTime interviewScheduledAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "interview_mode", length = 20)
    private InterviewMode interviewMode;

    @Column(name = "interview_meeting_link", columnDefinition = "TEXT")
    private String interviewMeetingLink;

    @Column(name = "interview_location", columnDefinition = "TEXT")
    private String interviewLocation;

    @Column(name = "interview_feedback", columnDefinition = "TEXT")
    private String interviewFeedback;

    @Column(name = "interview_evidence_url", columnDefinition = "TEXT")
    private String interviewEvidenceUrl;

    @Column(name = "interview_scored_at")
    private LocalDateTime interviewScoredAt;

    @Column(name = "certificate_score")
    private Double certificateScore;

    @Column(name = "interview_score")
    private Double interviewScore;

    @Column(name = "decision_score")
    private Double decisionScore;

    @Column(name = "certificate_weight_applied")
    private Double certificateWeightApplied;

    @Column(name = "interview_weight_applied")
    private Double interviewWeightApplied;

    @Column(name = "approval_threshold_applied")
    private Double approvalThresholdApplied;

    @Column(name = "decision_reason", columnDefinition = "TEXT")
    private String decisionReason;
}
