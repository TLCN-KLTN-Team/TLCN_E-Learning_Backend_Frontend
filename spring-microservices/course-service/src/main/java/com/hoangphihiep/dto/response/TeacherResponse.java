package com.hoangphihiep.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeacherResponse {
    private String id;

    private String username;

    private String email;

    private String firstName;

    private String lastName;

    private String dob;

    private String teacherId;

    private String departmentId;

    private String educationalUnitId;

    private String description;

    private String socialUrl;

    private String bankAccountNumber;

    private DepartmentResponse department;

    private EducationalUnitResponse educationalUnit;

    private String accountStatus;

    private String avatarUrl;

    private String phoneNumber;

    private String bio;
}
