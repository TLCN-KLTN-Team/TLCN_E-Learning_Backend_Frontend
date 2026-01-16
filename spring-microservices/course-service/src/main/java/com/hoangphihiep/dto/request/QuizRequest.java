package com.hoangphihiep.dto.request;

import jakarta.persistence.Column;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizRequest {

    private Integer id;

    @NotNull(message = "Section ID is required")
    private Integer sectionId;

    @NotBlank(message = "Quiz title is required")
    private String title;

    @Column(length = 1000)
    private String description;

    @NotNull(message = "Duration is required")
    private Integer duration;

    private Integer attemptLimit;

    private Double passingScore;

    private Integer numberItem;

    private Boolean showResults;

    private Boolean isPublished;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    @Valid
    private Set<QuestionRequest> questions; // For backward compatibility (optional)
    
    private Set<Integer> questionIds; // For many-to-many relationship

    private Date createdAt;

    private Date updateAt;
}
