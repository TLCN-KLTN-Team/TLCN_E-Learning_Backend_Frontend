package com.hoangphihiep.entity;

import java.io.Serial;
import java.io.Serializable;
import java.util.HashSet;
import java.util.Set;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.NamedQuery;
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
@Table(name="favorite_course")
@NamedQuery(name="FavoriteCourse.findAll", query="SELECT f from FavoriteCourse f")
public class FavoriteCourse implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "user_id")
    private String idUser;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "favorite_course_detail",
            joinColumns = @JoinColumn(name = "favorite_course_id"),
            inverseJoinColumns = @JoinColumn(name = "course_id")
    )
    private Set<PublishedCourse> courses = new HashSet<>();
}
