package com.hoangphihiep.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublishCourseRequest {

    @NotNull(message = "Course ID is required")
    private Integer courseId;

    @NotNull(message = "Course type ID is required")
    private Integer courseTypeId;
    private String courseName;
    private String description;
    private String courseIntroduction;
    private String courseImage;
    private String courseVideo;
    private String learnerAchievements;
    private String courseLearner;
    private List<String> courseTarget;

    @NotNull(message = "Course price is required")
    @Min(value = 0, message = "Course price must be greater than or equal to 0")
    private BigDecimal coursePrice;

    private String note; // Ghi chú khi gửi duyệt
}