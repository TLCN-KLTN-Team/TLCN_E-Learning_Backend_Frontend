package com.hoangphihiep.entity;

import java.io.Serializable;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Data
@EqualsAndHashCode(exclude = "section")
@Table(name="lesson")
@NamedQuery(name="Lesson.findAll", query="SELECT l from Lesson l")
public class Lesson implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private int id;

    @Column(name = "title", length = 255)
    private String title;

    @Column(name = "description", length = 1000)
    private String description;

    private String content;

    @ElementCollection
    private List<String> attachments;

    @Column(name = "videoUrl", length = 1000)
    private String videoUrl;

    @Column(name = "number_item")
    private int numberItem;

    @Column(name = "is_free_lesson")
    private Boolean isFreeLesson;

    @ManyToOne
    @JoinColumn(name = "section_id")
    private Section section;

    @OneToMany(mappedBy = "lesson", cascade = CascadeType.ALL)
    private Set<LessonProgress> lessonProgresses = new HashSet<>();

}
