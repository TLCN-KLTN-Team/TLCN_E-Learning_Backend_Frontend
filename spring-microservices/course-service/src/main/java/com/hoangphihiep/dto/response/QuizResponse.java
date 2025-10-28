package com.hoangphihiep.dto.response;

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
public class QuizResponse {

    private Integer id;

    private Integer sectionId;

    private String sectionName;

    private String title;

    private String description;

    private Integer duration;

    private Integer attemptLimit;

    private Double passingScore;

    private Integer numberItem;

    private Boolean showResults;

    private Boolean isPublished;

    private Set<QuestionResponse> questions;

    private Integer attemptsCount;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private Date createdAt;

    private Date updateAt;
}
