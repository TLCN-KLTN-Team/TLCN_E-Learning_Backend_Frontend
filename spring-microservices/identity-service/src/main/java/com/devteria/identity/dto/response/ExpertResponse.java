package com.devteria.identity.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ExpertResponse {
    private String id;

    private String username;

    private String email;

    private String firstName;

    private String lastName;

    private String dob;

    private String expertId;

    private String educationalUnitId;

    private String description;

    private String accountStatus;

    private String avatarUrl;

    private String phoneNumber;

    private String bio;
}
