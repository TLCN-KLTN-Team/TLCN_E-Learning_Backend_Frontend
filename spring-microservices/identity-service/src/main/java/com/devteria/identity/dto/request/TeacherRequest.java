package com.devteria.identity.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TeacherRequest {
    @NotBlank(message = "Username is required")
    private String username;

    private String password;

    @Email(message = "Email should be valid")
    @NotBlank(message = "Email is required")
    private String email;

    @NotBlank(message = "First name is required")
    private String firstName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    private String dob;

    @NotBlank(message = "Teacher ID is required")
    private String teacherId;

    private String departmentId;

    private String educationalUnitId;

    private String description;

    private String socialUrl;

    private String bankAccountNumber;

    private String accountStatus;
}
