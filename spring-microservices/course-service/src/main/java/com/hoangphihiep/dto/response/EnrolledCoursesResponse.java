package com.hoangphihiep.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EnrolledCoursesResponse {
    private int courseId;
    private long classId;
    private String courseName;
    private String enrollmentDate;
    private int progressPercentage;
}
