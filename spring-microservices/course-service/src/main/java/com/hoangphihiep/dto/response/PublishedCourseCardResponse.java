package com.hoangphihiep.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

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
    BigDecimal amountPrice;
    double rating;
    int reviewCount;
    int studentCount;
    String category;
    String thumbnailUrl;
    boolean isHandsOn;
    double duration;
    String level;
    String status;
}
