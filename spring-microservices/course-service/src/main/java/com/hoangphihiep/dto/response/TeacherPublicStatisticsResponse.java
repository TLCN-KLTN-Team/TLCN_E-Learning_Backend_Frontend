package com.hoangphihiep.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeacherPublicStatisticsResponse {
    private Integer totalCourses;
    private Integer totalStudents;
    private Double totalRevenue;
    private Integer totalQuizAttempts;
    private Integer totalAssignmentsSubmitted;
    private Integer pendingAssignments;
    private Double averageCourseRating;
}
