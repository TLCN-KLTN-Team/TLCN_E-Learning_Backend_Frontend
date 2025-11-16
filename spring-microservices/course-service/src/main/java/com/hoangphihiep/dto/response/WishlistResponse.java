package com.hoangphihiep.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class WishlistResponse {
    String originalPrice;
    String discountedPrice;
    String amount;
    List<Course> cartCourses;
    List<Course> favoriteCourses;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Course {
        Integer courseId;
        String courseName;
        String authorName;
        float rating;
        float duration;
        String originalPrice;
        String currentPrice;
    }
}
