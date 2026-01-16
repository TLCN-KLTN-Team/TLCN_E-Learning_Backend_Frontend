package com.hoangphihiep.entity;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;
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
@EqualsAndHashCode(exclude = {"section"})
@Table(name="quiz")
@NamedQuery(name="Quiz.findAll", query="SELECT q from Quiz q")
public class Quiz implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "title", length = 255)
    private String title;

    @Column(name = "description", length = 1000)
    private String description;

    @Column(name = "duration")
    private int duration;

    private int attemptLimit;

    private double passingScore;

    @Column(name = "number_item")
    private int numberItem;

    private Boolean showResults;

    private Boolean isPublished;

    private Date createdAt;

    private Date updateAt;

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;
    
    @ManyToOne
    @JoinColumn(name = "section_id")
    private Section section;

    // Removed direct relationship with Question - now using QuizQuestion join table
    // Many-to-many relationship handled via QuizQuestion entity

    @OneToMany(mappedBy = "quiz", cascade = CascadeType.ALL)
    private Set<QuizAttempt> quizAttempts = new HashSet<>();
}
