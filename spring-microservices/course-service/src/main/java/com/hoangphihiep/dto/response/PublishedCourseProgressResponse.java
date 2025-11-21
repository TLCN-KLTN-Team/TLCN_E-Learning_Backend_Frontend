package com.hoangphihiep.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PublishedCourseProgressResponse {

    Integer publishedCourseId;
    String publishedCourseName;
    String authorName;
    double progressPercentage;
    String thumbnailUrl;

}
