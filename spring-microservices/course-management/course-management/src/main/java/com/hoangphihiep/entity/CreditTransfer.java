package com.hoangphihiep.entity;

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

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "student_id")
    private String idStudent;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_course_id", nullable = false)
    private Course sourceCourse;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_institution_id", nullable = false)
    private EducationalUnit sourceInstitution;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_course_id", nullable = false)
    private Course targetCourse;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_institution_id", nullable = false)
    private EducationalUnit targetInstitution;

    @Column(name = "status", length = 50)
    private String status;

    @Column(name = "request_date")
    private LocalDateTime requestDate;

    @Column(name = "approved_by")
    private String approvedById;

    @Column(name = "approved_date")
    private LocalDateTime approvedDate;
}
