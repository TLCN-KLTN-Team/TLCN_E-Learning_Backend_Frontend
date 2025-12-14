package com.hoangphihiep.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeacherDetailResponse {
    private String id;
    private String name;
    private String email;
    private String phone;
    private String avatar;
    private String bio;
    private String description;
    private DepartmentResponse department;
    private EducationalUnitResponse educationalUnit;
    private Integer totalPublishedCourses;
    private Integer totalStudents;
    private Double averageRating;
}
