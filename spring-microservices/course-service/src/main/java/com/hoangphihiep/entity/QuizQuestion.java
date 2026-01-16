package com.hoangphihiep.entity;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;

@Entity
@Table(name = "quiz_questions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@IdClass(QuizQuestion.QuizQuestionId.class)
public class QuizQuestion {

    @Id
    @Column(name = "quiz_id")
    private Integer quizId;

    @Id
    @Column(name = "question_id")
    private Integer questionId;

    @Column(name = "order_index")
    private Integer orderIndex;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id", insertable = false, updatable = false)
    private Quiz quiz;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", insertable = false, updatable = false)
    private Question question;

    // Composite primary key class
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuizQuestionId implements Serializable {
        private Integer quizId;
        private Integer questionId;
    }
}
