package com.hoangphihiep.dto.response;

import com.hoangphihiep.dto.response.user.PublishedCourseContentResponse;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PublishedCourseDetailResponse {
    String courseName;
    String description;
    String whatYouWillLearn;
    String targetAudience;
    int rating;
    int studentCount;
    double duration;
    String authorName;
    boolean purchaserStatus; // NOT_ENROLLED, ENROLLED, COMPLETED

    String thumbnailUrl;
    String coursePrice;
    String level;
    String category;
    boolean isHandsOn;

    List<PublishedCourseContentResponse> contents;

    // reviews

}
