package com.devteria.identity.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import com.devteria.identity.validator.DobConstraint;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.Set;

@Data
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserCreationRequest {
    @Size(min = 4, message = "USERNAME_INVALID")
    String username;

    @Size(min = 6, message = "INVALID_PASSWORD")
    String password;

    @Size(min = 6, message = "INVALID_CONFIRM_PASSWORD")
    String confirmPassword;

    @Email(message = "INVALID_EMAIL")
    @NotBlank(message = "EMAIL_IS_REQUIRED")
    String email;

    Set<String> roles;
}
