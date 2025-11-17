package com.hoangphihiep.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Date;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublishedCourseResponse {

    private Integer id;

    private CourseResponse course;

    private CourseTypeResponse courseType;

    private String description;

    private String courseIntroduction;

    private String courseImage;

    private String courseVideo;

    private String learnerAchievements;

    private String courseLearner;

    private List<String> courseTarget;

    private BigDecimal coursePrice;

    private Integer status; // 0: Draft, 1: Pending Approval, 2: Approved, 3: Rejected

    private String statusText;

    private Date createdAt;

    private Date updatedAt;

    private List<SectionResponse> publishedSections; // Các section được public

    private Integer totalPublishedLessons;

    private Integer totalPublishedQuizzes;

    private Integer totalPublishedAssignments;
}