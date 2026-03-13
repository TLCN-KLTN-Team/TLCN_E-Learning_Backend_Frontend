package com.hoangphihiep.entity;

import java.io.Serial;
import java.io.Serializable;
import java.sql.Date;
import java.util.HashSet;
import java.util.Set;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.NamedQuery;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Table(name="course_progress")
@NamedQuery(name="CourseProgress.findAll", query="SELECT cp from CourseProgress cp")
public class CourseProgress implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "user_id")
    private String idUser;

    @ManyToOne
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Column(name = "progress_percentage")
    private double progressPercentage;

    @Column(name = "start_date")
    private Date startDate;

    @Column(name = "complete_date")
    private Date completeDate;

    @Column(name = "is_completed")
    private boolean isCompleted;

    @Column(name = "is_completed_via_credit_transfer")
    private Boolean completedViaCreditTransfer = false;

    @OneToMany(mappedBy = "courseProgress", cascade = CascadeType.ALL)
    private Set<LessonProgress> lessonProgresses = new HashSet<>();
}
