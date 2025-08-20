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
    private boolean emailVerified;
    private Set<RoleResponse> roles;

    // Teacher specific fields
    private String teacherId;
    private DepartmentResponse department;
    private EducationalUnitResponse educational;
    private String description;
    private String socialUrl;
    private String bankAccountNumber;
}
