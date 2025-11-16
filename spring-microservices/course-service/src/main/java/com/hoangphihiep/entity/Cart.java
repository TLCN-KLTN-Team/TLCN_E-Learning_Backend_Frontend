package com.hoangphihiep.entity;

import java.io.Serial;
import java.io.Serializable;
import java.util.HashSet;
import java.util.Set;


import com.devteria.identity.entity.User;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.NamedQuery;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.*;

@Builder
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Table(name="cart")
@NamedQuery(name="Cart.findAll", query="SELECT c from Cart c")
public class Cart implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @ManyToMany
    @JoinTable(
            name = "cart_detail",
            joinColumns = @JoinColumn(name = "cart_id"),
            inverseJoinColumns = @JoinColumn(name = "course_id")
    )
    @Builder.Default
    private Set<PublishedCourse> courses = new HashSet<>();

    @Column(name = "user_id", unique = true)
    private String idUser;

    public void addCourse(PublishedCourse course) {
        if (course != null && !this.courses.contains(course)) {
            this.courses.add(course);
            course.getCart().add(this);
        }
    }

    public void removeCourse(PublishedCourse course) {
        if (course != null && this.courses.contains(course)) {
            this.courses.remove(course);
            course.getCart().remove(this);  // Đồng bộ ngược lại
        }
    }
}