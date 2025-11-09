package com.hoangphihiep.entity;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serial;
import java.io.Serializable;
import java.util.Date;

@Entity
@Table(name = "class_content_visibility",
        uniqueConstraints = @UniqueConstraint(
                columnNames = {"class_id", "content_type", "content_id"}
        ))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClassContentVisibility implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "class_id", nullable = false)
    private CourseClass courseClass;

    @Column(name = "content_type", nullable = false, length = 20)
    private String contentType; // "SECTION", "LESSON", "QUIZ", "ASSIGNMENT"

    @Column(name = "content_id", nullable = false)
    private Integer contentId;

    @Column(name = "is_visible", nullable = false)
    private Boolean isVisible = true;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "created_at")
    private Date createdAt;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "updated_at")
    private Date updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = new Date();
        updatedAt = new Date();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = new Date();
    }
}