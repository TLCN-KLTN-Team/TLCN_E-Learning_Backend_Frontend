package com.hoangphihiep.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class InstructorInfoResponse {
    String instructorId;
    String instructorName;
    String instructorAvatar;
    String instructorTagline;
    String instructorBio;
    String socialUrl;
    
    // Statistics
    double instructorRating;
    int totalReviews;
    int totalStudents;
    int totalCourses;
}
