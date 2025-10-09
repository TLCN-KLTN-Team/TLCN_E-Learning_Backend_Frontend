package com.hoangphihiep.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseDetailResponse {

    private Integer id;
    private Integer courseId;
    private String courseName;

    private String description;
    private String courseIntroduction;
    private String courseImage;
    private String courseVideo;
    private String learnerAchievements;
    private String courseLearner;
    private List<String> courseTarget;
}
