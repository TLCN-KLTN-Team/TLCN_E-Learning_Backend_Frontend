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
    double starNumber;
    int reviews;
    int students;
    double duration;
    String courseIntroduction;
    String authorName;
    boolean purchaserStatus; // NOT_ENROLLED, ENROLLED, COMPLETED
    String thumbnailUrl;
    String videoIntroUrl;
    String coursePrice;
    String level;
    String category;
    boolean isHandsOn;

    // contents
    List<PublishedCourseContentResponse> contents;

    //
    String achievements;


    // course type
    String courseType;
    String descriptionType;

    // reviews
    
    // ===== NEW FIELDS =====
    String courseVideo;
    List<SectionResponse> sections;
    String whatYouWillLearn;
    String targetAudience;
    List<String> courseTarget;  // Learning objectives list
    
    // Aliases for frontend compatibility
    double rating;  // Same as starNumber
    int studentCount;  // Same as students

}
