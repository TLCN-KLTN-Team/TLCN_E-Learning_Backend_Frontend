package com.hoangphihiep.entity;

import java.io.Serializable;
import java.util.Date;
import java.util.HashSet;
import java.util.Set;


import com.devteria.identity.entity.*;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.NamedQuery;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
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
@Table(name="course")
@NamedQuery(name="Course.findAll", query="SELECT c from Course c")
public class Course implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private int id;

    @Column(name = "course_name")
    private String courseName;

    @Column(name = "course_code", unique = true, length = 50)
    private String courseCode;

    @Column(name = "description", length = 1000)
    private String description;

    @Column(name = "credits")
    private Integer credits;

    @Column(name = "max_students")
    private Integer maxStudents;

    @Column(name = "current_students")
    private Integer currentStudents = 0;

    @ManyToOne
    @JoinColumn(name = "course_type_id", nullable = false)
    private CourseType courseType;

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL,fetch = FetchType.EAGER)
    private Set<Section> sections = new HashSet<>();

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<CourseEnrollment> enrollments = new HashSet<>();

    @OneToMany(mappedBy = "targetCourse", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<CreditTransfer> targetCreditTransfers = new HashSet<>();

    private Date createdAt;

    private Date updatedAt;

    @Column(name = "teacher_id")
    private String idTeacher;

    @ManyToOne
    @JoinColumn(name = "educationalUnit_id")
    private EducationalUnit educationalUnit;

    public void addSection(Section section) {
        if (section != null && !sections.contains(section)) {
            sections.add(section);
        }
    }

    @OneToOne(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true)
    private PublishedCourse publishedCourse;
}
