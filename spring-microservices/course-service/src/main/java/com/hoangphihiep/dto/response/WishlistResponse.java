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
    List<Course> courses;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Course {
        Integer courseId;
        String courseName;
        String authorName;
        double rating;
        double duration;
        String originalPrice;
        String currentPrice;
        int numberOfLessons;
        String thumbnail;
    }
}
