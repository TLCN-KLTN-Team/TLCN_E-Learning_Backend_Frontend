package com.hoangphihiep.entity;

import com.devteria.identity.entity.User;
import jakarta.persistence.*;
import lombok.*;
import java.util.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Column(name = "user_id")
    private String idUser;

    private double score;
    private double totalScore;
    private Boolean isPassed;
    private Date startedAt;
    private Date submittedAt;
    private int timeSpent;

    @ManyToOne
    @JoinColumn(name = "quiz_id", nullable = false)
    private Quiz quiz;

    @OneToMany(mappedBy = "quizAttempt", cascade = CascadeType.ALL)
    private List<QuizAttemptAnswer> answers;
}
