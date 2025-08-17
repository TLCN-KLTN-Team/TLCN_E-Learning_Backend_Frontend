package com.hoangphihiep.entity;

import java.io.Serializable;
import java.util.Date;
import java.util.HashSet;
import java.util.Set;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.NamedQuery;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@EqualsAndHashCode(exclude = {"lessons", "quizs", "course"})
@Table(name="section")
@NamedQuery(name="Section.findAll", query="SELECT s from Section s")
public class Section implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private int id;

    @Column(nullable = false, length = 255)
    private String title;

    private String description;

    private int orderIndex;

    private Boolean isPublished;

    private Date createdAt;

    @OneToMany(mappedBy = "section", cascade = CascadeType.ALL,fetch = FetchType.EAGER)
    @ToString.Exclude
    private Set<Lesson> lessons = new HashSet<>();

    public void addLesson(Lesson lesson) {
        if (lesson != null && lesson != null && !lessons.contains(lesson)) {
            lessons.add(lesson);
        }
    }

    @OneToMany(mappedBy = "section", cascade = CascadeType.ALL,fetch = FetchType.EAGER)
    @ToString.Exclude
    private Set<Quiz> quizs = new HashSet<>();

    public void addQuiz(Quiz quiz) {
        if (quiz != null && quiz != null && !quizs.contains(quiz)) {
            quizs.add(quiz);
        }
    }

    @ManyToOne
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

}
