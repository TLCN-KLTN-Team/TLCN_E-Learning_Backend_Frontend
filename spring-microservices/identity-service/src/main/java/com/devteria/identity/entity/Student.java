package com.devteria.identity.entity;

import jakarta.persistence.*;

import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "students")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Student extends User {

    private String studentId;

    @Column(name = "department_id")
    private int idDepartment;

    @Column(name = "educational_unit_id")
    private int idEducational;

    private String description;
    private String socialUrl;
    private String className;
}
