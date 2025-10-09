package com.hoangphihiep.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class SectionRequest {

    private Integer id;

    @NotNull(message = "Course ID is required")
    private Integer courseId;

    @NotBlank(message = "Section title is required")
    private String title; // Đổi từ sectionName thành title

    private String description;

    private Integer orderIndex;

    private Boolean isPublished;

    private Set<LessonRequest> lessons;

    private Set<QuizRequest> quizzes;

    private Date createdAt;

    private Date updateAt;
}
