package com.hoangphihiep.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicCourseResponse {
    private Integer id;
    private Integer publishedCourseId; // ID of the published course
    private String courseName;
    private String description;
    private Integer credits;
    private Integer maxStudents;
    private Integer currentStudents; // Number of users who purchased
    private BigDecimal price; // From publishedCourse.coursePrice
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
