package com.hcmute.file_service.dto.response;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class EducationalUnitDetailResponse {
    private Integer id;
    private String name;
    private String type;
    private String address;
    private String phone;
    private String email;
    private String website;
    private String logo;
    private String description;
    private Integer establishedYear;
    private Integer totalDepartments;
    private Integer totalCourses;
    private Integer totalTeachers;
    private Long totalStudents;
    private String representativeName;
    private String representativeEmail;
    private String representativePhone;

    private List<Teacher> teachers;
    private List<Course> courses;
    private List<String> departments;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Teacher {
        String id;
        String avatarUrl;
        String academicDegree;
        String name;
        String departmentName;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Course {
        Integer id;
        String name;
        String description;
        String departmentName;
        String coverImageUrl;
        double duration;
        int numberOfStudents;
        double averageRating;
        String price;
    }
}
