package com.hoangphihiep.entity;

import com.hoangphihiep.utils.PublishedCourseStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Table(name="published_course")
@NamedQuery(name="PublishedCourse.findAll", query="SELECT p from PublishedCourse p")
public class PublishedCourse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Enumerated(EnumType.STRING)
    private PublishedCourseStatus newStatus;

    @Column(name = "course_price", precision = 18, scale = 2)
    private BigDecimal coursePrice;

    @Column(name = "author_name")
    private String authorName;

    private Date createdAt;

    private Date updatedAt;

    @ManyToOne
    @JoinColumn(name = "course_type_id", nullable = false)
    private CourseType courseType;

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL)
    private Set<Review> review = new HashSet<>();

    @ManyToMany(mappedBy = "courses", fetch = FetchType.EAGER)
    private Set<FavoriteCourse> favoriteCourse = new HashSet<>();

    @ManyToMany(mappedBy = "courses", cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private Set<Cart> cart = new HashSet<>();

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL)
    private Set<OrderItem> orderItems = new HashSet<>();

    @Column(name = "status")
    private int status;

    @OneToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false, unique = true)
    private Course course;

    @Column(name = "course_name")
    private String courseName;

    @Column(columnDefinition = "LONGTEXT")
    private String description;

    @Column(name = "course_introduction", columnDefinition = "LONGTEXT")
    private String courseIntroduction;

    @Column(name = "course_image", length = 255)
    private String courseImage;

    @Column(name = "course_video", length = 255)
    private String courseVideo;

    @Column(name = "learner_achievements", columnDefinition = "LONGTEXT")
    private String learnerAchievements;

    @Column(name = "course_learner", columnDefinition = "LONGTEXT")
    private String courseLearner;

    @ElementCollection
    private List<String> courseTarget;
}
