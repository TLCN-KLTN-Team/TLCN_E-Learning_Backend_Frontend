<<<<<<< HEAD
package com.hoangphihiep.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.util.Date;

@Entity
@Table(name = "course_enrollments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseEnrollment implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Column(name = "student_id", nullable = false)
    private String studentId;

<<<<<<< HEAD
    @Column(name = "enrolled_by")
    private String enrolledBy;
}
=======
    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "enrolled_at")
    private Date enrolledAt;

    @Column(name = "status", length = 50)
    private String status = "ACTIVE";

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "completed_at")
    private Date completedAt;

    @Column(name = "grade", length = 10)
    private String grade;

    @Column(name = "points")
    private Double points;

    // Add unique constraint
    @Table(uniqueConstraints = {
            @UniqueConstraint(columnNames = {"course_id", "student_id"})
    })
    public static class CourseEnrollmentConstraints {}
}
>>>>>>> 7d07dd6 (feat: update backend for course-management and identity-service)
=======
package com.hoangphihiep.entity;public class CourseEnrollment {
}
>>>>>>> f632bb4 (fix: rebase for this branch)
