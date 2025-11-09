package com.hoangphihiep.entity;

import java.io.Serial;
import java.io.Serializable;
import java.util.HashSet;
import java.util.Set;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.NamedQuery;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Table(name="discussion")
@NamedQuery(name="Discussion.findAll", query="SELECT d from Discussion d")
public class Discussion implements Serializable{

    @Serial
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "content",nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "user_id")
    private String idUser;

    @Column(name = "asked_at", nullable = false)
    private LocalDateTime askedAt;

    @ManyToOne
    @JoinColumn(name = "published_course_id", nullable = false)
    private PublishedCourse course;

    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Discussion> replies = new HashSet<>();

    @ManyToOne
    @JoinColumn(name = "parent_id")
    private Discussion parent;

}