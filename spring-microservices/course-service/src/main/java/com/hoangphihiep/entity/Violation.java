package com.hoangphihiep.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "violations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Violation {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "user_id")
    private String userId;
    
    @Column(name = "violation_type", length = 100)
    private String violationType;
    
    @Column(name = "description", length = 1000)
    private String description;
    
    @Column(name = "status", length = 50)
    private String status; // PENDING, REVIEWED, RESOLVED, DISMISSED
    
    @Column(name = "severity", length = 50)
    private String severity; // LOW, MEDIUM, HIGH, CRITICAL
    
    @Column(name = "reported_at")
    private LocalDateTime reportedAt;
    
    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;
    
    @Column(name = "reviewed_by")
    private String reviewedBy;
    
    @ManyToOne
    @JoinColumn(name = "course_id")
    private Course course;
    
    @Column(name = "reference_id")
    private String referenceId; // Could be assignment ID, quiz ID, etc.
}
