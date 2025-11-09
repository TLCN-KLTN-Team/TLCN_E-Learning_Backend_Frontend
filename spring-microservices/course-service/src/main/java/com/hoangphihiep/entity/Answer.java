package com.hoangphihiep.entity;

import java.io.Serial;
import java.io.Serializable;
import java.util.Date;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.NamedQuery;
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
@Table(name="answer")
@NamedQuery(name="Answer.findAll", query="SELECT a from Answer a")
public class Answer implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "content",length = 500)
    private String content;

    @Column(name = "is_correct")
    @JsonProperty("isCorrect")
    private Boolean isCorrect;

    private int orderIndex;

    private Date createdAt;

    private Date updateAt;

    @ManyToOne
    @JoinColumn(name = "question_id")
    private Question question;
}
