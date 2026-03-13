package com.hoangphihiep.entity;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;

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

    @Column(name = "attachment_url", columnDefinition = "TEXT")
    private String attachmentUrl;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "student_name")
    private String studentName;

    @Column(name = "educational_unit_name")
    private String educationalUnitName;

    @Column(name = "status", length = 50)
    private String status; // PENDING, APPROVED, REJECTED

    @Column(name = "request_date")
    private LocalDateTime requestDate;

    @Column(name = "approved_by")
    private String approvedById;

    @Column(name = "approved_date")
    private LocalDateTime approvedDate;
}
