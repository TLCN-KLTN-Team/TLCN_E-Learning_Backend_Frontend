package com.hoangphihiep.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class EquivalentCourseResponse {
    private Integer id;
    
    // Source Course Info (PublishedCourse)
    private Integer sourceCourseId;
    private String sourceCourseName;
    private String sourceCourseCode; // Added
    private Integer sourceCourseCredits; // Added
    private String sourceCourseImage;
    private String sourceEducationalUnit;

    // Target Course Info (Internal Course)
    private Integer targetCourseId;
    private String targetCourseName;
    private String targetCourseCode; // Added
    private Integer targetCourseCredits; // Added
    
    private String requirements;
    private String description;
    
    private Boolean status;
    private LocalDateTime validFrom;
    private LocalDateTime validUntil;

    private Double minQuizScore;
    private Double minAssignmentScore;
    private String requiredRank;

    private Double certificateWeight;
    private Double interviewWeight;
    private Double approvalThreshold;
    
    private String createdBy;
    private LocalDateTime createdAt;
    private String updatedBy;
    private LocalDateTime updatedAt;
}
