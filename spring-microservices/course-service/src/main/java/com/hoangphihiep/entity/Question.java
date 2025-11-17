package com.hoangphihiep.entity;

import java.io.Serial;
import java.io.Serializable;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Table(name="question")
@NamedQuery(name="Question.findAll", query="SELECT q from Question q")
public class Question implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "question_text", length = 1000)
    private String questionText;

    private String questionType;

    private int orderIndex;

    @ElementCollection
    private List<String> attachments;

    @Column(name = "score")
    private Double score;

    private Date createdAt;

    private Date updateAt;

    @OneToMany(mappedBy = "question",fetch = FetchType.EAGER, cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Answer> answers = new HashSet<>();

    public void addAnswer(Answer answer) {
        if (answer != null) {
            answers.add(answer);
        }
    }

    @ManyToOne
    @JoinColumn(name = "quiz_id", nullable = false)
    private Quiz quiz;
}
