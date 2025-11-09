package com.hoangphihiep.entity;

import java.io.Serial;
import java.io.Serializable;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import jakarta.persistence.*;
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
@EqualsAndHashCode(exclude = {"section", "submissions"})
@Table(name="assignment")
@NamedQuery(name="Assignment.findAll", query="SELECT a from Assignment a")
public class Assignment implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "title", length = 255, nullable = false)
    private String title;

    @Column(name = "description", length = 2000)
    private String description;

    @Column(name = "deadline")
    private Date deadline;

    @ElementCollection
    @Column(name = "assignment_files")
    private List<String> assignmentFiles;

    @Column(name = "submission_type", length = 50)
    private String submissionType;

    @ElementCollection
    @Column(name = "rubric_files")
    private List<String> rubricFiles;

    @Column(name = "max_score")
    private Integer maxScore;

    @Column(name = "number_item")
    private Integer numberItem;

    @Column(name = "is_published")
    private Boolean isPublished;

    @Column(name = "created_at")
    private Date createdAt;

    @Column(name = "update_at")
    private Date updateAt;

    @ManyToOne
    @JoinColumn(name = "section_id", nullable = false)
    private Section section;

    @OneToMany(mappedBy = "assignment", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @ToString.Exclude
    private Set<AssignmentSubmission> submissions = new HashSet<>();

    public void addSubmission(AssignmentSubmission submission) {
        if (submission != null && !submissions.contains(submission)) {
            submissions.add(submission);
            submission.setAssignment(this);
        }
    }
}