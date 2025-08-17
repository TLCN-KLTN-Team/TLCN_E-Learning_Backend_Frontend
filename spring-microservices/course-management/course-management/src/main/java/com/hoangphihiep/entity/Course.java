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

    @ManyToOne
    @JoinColumn(name = "course_type_id", nullable = false)
    private CourseType courseType;

    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "course_detail_id", referencedColumnName = "id")
    private CourseDetail courseDetail;

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL,fetch = FetchType.EAGER)
    private Set<Section> sections = new HashSet<>();

    @Column(name = "course_price")
    private double coursePrice;

    private Boolean visibility;

    private Date publishedAt;

    private Date createdAt;

    private Date updatedAt;

    private Boolean isApproved;

    @Column(name = "teacher_id")
    private int idTeacher;

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL)
    private Set<Review> review = new HashSet<>();

    @ManyToMany(mappedBy = "courses", fetch = FetchType.EAGER)
    private Set<FavoriteCourse> favoriteCourse = new HashSet<>();

    @ManyToMany(mappedBy = "courses", cascade = CascadeType.ALL)
    private Set<Cart> cart = new HashSet<>();


    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL)
    private Set<OrderItem> orderItems = new HashSet<>();

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL)
    private Set<Discussion> discussions = new HashSet<>();

    @Column(name = "status")
    private int status;

    public void addSection(Section section) {
        if (section != null && !sections.contains(section)) {
            sections.add(section);
        }
    }

    public void addDiscussion(Discussion discussion) {
        if (discussion != null && !discussions.contains(discussion)) {
            discussions.add(discussion);
        }
    }
}
