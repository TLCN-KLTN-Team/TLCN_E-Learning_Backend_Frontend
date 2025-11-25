package com.hoangphihiep.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MarkLessonCompleteRequest {

    @NotNull(message = "Lesson ID is required")
    private Integer lessonId;

    // For student learning in a class
    private Integer classId;

    // For user learning published course
    private Integer publishedCourseId;
}