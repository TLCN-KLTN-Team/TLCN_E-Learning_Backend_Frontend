package com.hoangphihiep.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PublishedCourseCardResponse {
    Integer id;
    String courseName;
    String authorName;
    String coursePrice;
    int rating;
    int reviewCount;
    int studentCount;
    String category;
    String thumbnailUrl;
    boolean isHandsOn;
    double duration;
    String level;
}
