package com.devteria.identity.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TeacherCreationRequest {
    @NotBlank(message = "User ID is required")
    String userId;

    @NotBlank(message = "Teacher ID is required")
    String teacherId;

    @NotNull(message = "Department ID is required")
    String departmentId;

    @NotNull(message = "Educational Unit ID is required")
    String educationalUnitId;

    String description;
    String socialUrl;
    String bankAccountNumber;
}
