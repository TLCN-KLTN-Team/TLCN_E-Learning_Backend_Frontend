package com.hoangphihiep.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeacherCourseResponse {
    private Integer id;
    private String courseName;
    private String description;
    private String courseIntroduction;
    private String thumbnailUrl;
    private String coursePrice;
    private Double rating;
    private Integer enrolledCount;
    private String duration;
    private String level;
    private String category;
}
