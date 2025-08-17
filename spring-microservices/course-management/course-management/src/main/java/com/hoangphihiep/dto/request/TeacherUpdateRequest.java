package com.hoangphihiep.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeacherUpdateRequest {
    @Email(message = "Email should be valid")
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

