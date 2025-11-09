package com.hoangphihiep.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serial;
import java.io.Serializable;
import java.util.List;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Table(name="course_detail")
@NamedQuery(name="CourseDetail.findAll", query="SELECT cd from CourseDetail cd")
public class CourseDetail implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "description", length = 1000)
    private String description;

    @Column(name = "course_introduction",length = 1000)
    private String courseIntroduction;

    @Column(name = "course_image", length = 255)
    private String courseImage;

    @Column(name = "course_video", length = 255)
    private String courseVideo;

    @Column(name = "learner_achievements", length = 500)
    private String learnerAchievements;

    @Column(name = "course_learner", length = 500)
    private String courseLearner;

    @OneToOne(mappedBy = "courseDetail")
    private PublishedCourse publicCourse;

    @ElementCollection
    private List<String> courseTarget;
}