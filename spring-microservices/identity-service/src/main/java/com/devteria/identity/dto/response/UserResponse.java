package com.devteria.identity.dto.response;

import java.time.LocalDate;
import java.util.Set;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserResponse {
    String id;
    String username;
    String email;
    String phoneNumber;
    String firstName;
    String lastName;
    String avatarUrl;
    String accountStatus;
    LocalDate dob;
    String bio;
    //    Set<String> favoriteCategories;
    String role;
    String createdAt;
}
