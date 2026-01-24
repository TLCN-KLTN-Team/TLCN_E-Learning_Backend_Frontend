package com.hoangphihiep.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ExpertRequest {
    @NotBlank(message = "Username is required")
    String username;

    String password;

    @Email(message = "Email should be valid")
    @NotBlank(message = "Email is required")
    String email;

    @NotBlank(message = "First name is required")
    String firstName;

    @NotBlank(message = "Last name is required")
    String lastName;

    String dob;

    @NotBlank(message = "Expert ID is required")
    String expertId;

    String educationalUnitId;

    String description;
    
    String accountStatus;
    
    String phoneNumber;
    
    String bio;
}
