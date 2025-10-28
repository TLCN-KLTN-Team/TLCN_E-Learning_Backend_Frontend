package com.hoangphihiep.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SectionResponse {

    private Integer id;

    private Integer courseId;

    private String courseName;

    private String title;

    private String description;

    private Integer orderIndex;

    private Boolean isPublished;

    private Date createdAt;

    private Date updateAt;

    private Set<LessonResponse> lessons;

    private Set<QuizResponse> quizs;

    private Set<AssignmentResponse> assignments;
}
