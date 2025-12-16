package com.devteria.identity.dto.request;

import java.time.LocalDate;

import org.springframework.web.multipart.MultipartFile;

import com.devteria.identity.validator.DobConstraint;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserUpdateRequest {
    String password;
    String firstName;
    String lastName;
    String email;
    String phoneNumber;
    MultipartFile file;
    String bio;

    @DobConstraint(min = 18, message = "INVALID_DOB")
    LocalDate dob;

    String role;
}
