package com.hoangphihiep.entity;

import java.io.Serial;
import java.io.Serializable;
import java.util.HashSet;
import java.util.Set;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.NamedQuery;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.*;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Table(name="course_type")
@Builder
@NamedQuery(name="CourseType.findAll", query="SELECT ct from CourseType ct")
public class CourseType implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "course_type_name", nullable = false, length = 255)
    private String courseTypeName;

    private String description;

    @OneToMany(mappedBy = "courseType", cascade = CascadeType.ALL)
    private Set<PublishedCourse> courses = new HashSet<>();

    @Builder.Default
    private boolean isDeleted = false;
}
