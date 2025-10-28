package com.hoangphihiep.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseResponse {
    private Integer id;

    private String courseName;

    private String description;

    private Integer credits;

    private Integer maxStudents;

    private Integer currentStudents;

    private Date createdAt;

    private Date updatedAt;

    private String idTeacher;

    private TeacherResponse teacher;

    private Integer idEducationalUnit;
}
