package com.hoangphihiep.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ExpertResponse {
    String id;
    String username;
    String email;
    String firstName;
    String lastName;
    String dob;
    String expertId;
    String educationalUnitId;
    String description;
    String accountStatus;
    String avatarUrl;
    String phoneNumber;
    String bio;
    EducationalUnitResponse educationalUnit;
}
