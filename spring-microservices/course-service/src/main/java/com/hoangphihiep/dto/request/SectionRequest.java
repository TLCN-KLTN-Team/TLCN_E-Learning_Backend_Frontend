package com.hoangphihiep.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.List;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SectionRequest {

    private Integer id;

    @NotBlank(message = "Section title is required")
    private String title; // Đổi từ sectionName thành title

    private String description;

    private Integer orderIndex;

    private Boolean isPublished;

    private List<Integer> visibleClassIds;

    private Set<LessonRequest> lessons;

    private Set<QuizRequest> quizzes;

    private Set<AssignmentRequest> assignments;

    private Date createdAt;

    private Date updateAt;
}
