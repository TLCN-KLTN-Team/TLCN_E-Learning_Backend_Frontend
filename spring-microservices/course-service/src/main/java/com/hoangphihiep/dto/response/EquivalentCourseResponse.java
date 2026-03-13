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
    private String sourceCourseImage;
    private String sourceEducationalUnit;

    // Target Course Info (Internal Course)
    private Integer targetCourseId;
    private String targetCourseName;
    
    private String requirements;
    private String description;
    
    private Boolean status;
    private LocalDateTime validFrom;
    private LocalDateTime validUntil;
    
    private String createdBy;
    private LocalDateTime createdAt;
    private String updatedBy;
    private LocalDateTime updatedAt;
}
