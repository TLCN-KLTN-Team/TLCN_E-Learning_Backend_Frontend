package com.hoangphihiep.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContentPublishStatusResponse {

    private Integer courseId;

    // Tổng số và số đã publish
    private Integer totalSections;
    private Integer publishedSections;

    private Integer totalLessons;
    private Integer publishedLessons;

    private Integer totalQuizzes;
    private Integer publishedQuizzes;

    private Integer totalAssignments;
    private Integer publishedAssignments;

    // Số lượng đã update (cho bulk publish)
    private Integer sectionsUpdated;
    private Integer lessonsUpdated;
    private Integer quizzesUpdated;
    private Integer assignmentsUpdated;

    private Boolean isPublished;

    // Tính % hoàn thành
    public Double getPublishPercentage() {
        int total = (totalSections != null ? totalSections : 0) +
                (totalLessons != null ? totalLessons : 0) +
                (totalQuizzes != null ? totalQuizzes : 0) +
                (totalAssignments != null ? totalAssignments : 0);

        int published = (publishedSections != null ? publishedSections : 0) +
                (publishedLessons != null ? publishedLessons : 0) +
                (publishedQuizzes != null ? publishedQuizzes : 0) +
                (publishedAssignments != null ? publishedAssignments : 0);

        return total > 0 ? (published * 100.0 / total) : 0.0;
    }
}