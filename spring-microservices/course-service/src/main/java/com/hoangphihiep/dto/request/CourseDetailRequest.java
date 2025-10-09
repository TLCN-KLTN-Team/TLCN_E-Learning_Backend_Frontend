package com.hoangphihiep.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseDetailRequest {

    private Integer id;

    @NotNull(message = "Course ID is required")
    private Integer courseId;

    private String description;
    private String courseIntroduction;
    private String courseImage;
    private String courseVideo;
    private String learnerAchievements;
    private String courseLearner;
    private List<String> courseTarget;
}
