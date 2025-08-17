package com.devteria.identity.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TeacherResponse {
    String id;
    String teacherId;
    String departmentId;
    String educationalUnitId;
    String description;
    String socialUrl;
    String bankAccountNumber;
    UserResponse user;
}
