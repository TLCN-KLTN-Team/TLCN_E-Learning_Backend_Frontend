package com.hoangphihiep.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseEnrollmentResponse {

    private Integer id;
    private Integer courseId;
    private String courseName;
    private String studentId;
    private String studentName;
    private Date enrolledAt;
    private String status;
}
