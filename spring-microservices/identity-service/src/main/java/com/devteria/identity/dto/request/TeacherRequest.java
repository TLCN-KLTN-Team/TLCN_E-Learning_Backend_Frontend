package com.devteria.identity.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
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
