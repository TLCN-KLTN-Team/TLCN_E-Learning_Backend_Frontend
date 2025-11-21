package com.hoangphihiep.entity;

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
@Table(name="PublishedCourse")
@NamedQuery(name="PublishedCourse.findAll", query="SELECT p from PublishedCourse p")
public class PublishedCourse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;


    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "course_detail_id", referencedColumnName = "id")
    private CourseDetail courseDetail;


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

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL)
    private Set<Discussion> discussions = new HashSet<>();

    @OneToMany(mappedBy = "sourceCourse", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<CreditTransfer> sourceCreditTransfers = new HashSet<>();

    @Column(name = "status")
    private int status;

    @OneToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false, unique = true)
    private Course course;

    @Column(length = 1000)
    private String description;

    @Column(name = "course_introduction", length = 1000)
    private String courseIntroduction;

    @Column(name = "course_image", length = 255)
    private String courseImage;

    @Column(name = "course_video", length = 255)
    private String courseVideo;

    @Column(name = "learner_achievements", length = 500)
    private String learnerAchievements;

    @Column(name = "course_learner", length = 500)
    private String courseLearner;

    @ElementCollection
    private List<String> courseTarget;

    public void addDiscussion(Discussion discussion) {
        if (discussion != null && !discussions.contains(discussion)) {
            discussions.add(discussion);
        }
    }
}
