package com.hoangphihiep.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseClassResponse {
    private Integer id;
    private String className;
    private String classCode;
    private Integer courseId;
    private String courseName;
    private Integer maxStudents;
    private Integer currentStudents;
    private Date startDate;
    private Date endDate;
    private String status;
    private String description;
    private Date createdAt;
    private Date updatedAt;
    private Boolean isArchived;
    private Date archivedAt;
}
