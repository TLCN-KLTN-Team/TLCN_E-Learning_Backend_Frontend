package com.hoangphihiep.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeacherRequest {

    String userId;

    private String username;

    private String password;

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
}
