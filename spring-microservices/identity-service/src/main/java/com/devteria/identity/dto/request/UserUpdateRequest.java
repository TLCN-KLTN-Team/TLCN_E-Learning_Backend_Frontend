package com.devteria.identity.dto.request;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

import com.devteria.identity.validator.DobConstraint;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.web.multipart.MultipartFile;

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
//    Set<String> favoriteCategories;

    @DobConstraint(min = 18, message = "INVALID_DOB")
    LocalDate dob;

    List<String> roles;
}
