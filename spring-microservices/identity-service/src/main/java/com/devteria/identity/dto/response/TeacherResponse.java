package com.devteria.identity.dto.response;

import java.util.Set;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
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
    private String departmentId;
    private String educationalId;
    private String description;
    private String socialUrl;
    private String bankAccountNumber;
}
