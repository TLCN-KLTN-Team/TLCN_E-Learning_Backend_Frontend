package com.hoangphihiep.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseProgressDetailResponse {
    private CourseProgressResponse courseProgress;
    private int totalItems;
    private int completedItems;
    private int completedLessons;
    private int completedQuizzes;
    private int completedAssignments;
}