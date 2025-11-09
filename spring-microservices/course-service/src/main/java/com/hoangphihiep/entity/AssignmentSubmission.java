package com.hoangphihiep.entity;

import java.io.Serial;
import java.io.Serializable;
import java.util.Date;
import java.util.List;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@EqualsAndHashCode(exclude = {"assignment", "user"})
@Table(name="assignment_submission")
public class AssignmentSubmission implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "submission_text", length = 5000)
    private String submissionText;

    @ElementCollection
    @Column(name = "submission_files")
    private List<String> submissionFiles;

    @Column(name = "submission_link", length = 500)
    private String submissionLink;

    @Column(name = "submitted_at")
    private Date submittedAt;

    @Column(name = "score")
    private Double score;

    @Column(name = "feedback", length = 2000)
    private String feedback;

    @Column(name = "graded_at")
    private Date gradedAt;

    @Column(name = "status", length = 20)
    private String status;

    @ManyToOne
    @JoinColumn(name = "assignment_id", nullable = false)
    private Assignment assignment;

    @Column(name = "user_id")
    private String idUser;
}