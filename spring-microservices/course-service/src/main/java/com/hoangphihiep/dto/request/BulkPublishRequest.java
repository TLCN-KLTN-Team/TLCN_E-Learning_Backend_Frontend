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
public class BulkPublishRequest {

    @NotNull(message = "Course ID is required")
    private Integer courseId;

    @NotNull(message = "Publish status is required")
    private Boolean isPublished;

    private List<Integer> sectionIds;
    private List<Integer> lessonIds;
    private List<Integer> quizIds;
    private List<Integer> assignmentIds;
}
