package com.devteria.identity.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentResponse {

    private String id;

    private String username;

    private String email;

    private String firstName;

    private String lastName;

    private String dob;

    private String studentId;

    private String departmentId;

    private String educationalUnitId;

    private String description;

    private String socialUrl;

    private String className;

    private String accountStatus;
}
