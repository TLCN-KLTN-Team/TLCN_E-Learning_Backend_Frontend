package com.devteria.identity.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

import lombok.Getter;

@Getter
public enum ErrorCode {
    // Success
    SUCCESS(1000, "Request successful", HttpStatus.OK),

    // General errors
    UNCATEGORIZED_EXCEPTION(9999, "Uncategorized error", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_KEY(1001, "Invalid request key", HttpStatus.BAD_REQUEST), // Sửa message

    // User related errors
    USER_EXISTED(1002, "User already exists", HttpStatus.BAD_REQUEST), // Sửa grammar
    USER_NOT_EXISTED(1005, "User does not exist", HttpStatus.NOT_FOUND), // Sửa grammar

    // Validation errors
    INVALID_CREDENTIALS(1101, "Invalid credentials", HttpStatus.UNAUTHORIZED), // Sửa message rõ ràng hơn
    USERNAME_INVALID(1003, "Username must be at least {min} characters", HttpStatus.BAD_REQUEST),
    INVALID_PASSWORD(1004, "Password must be at least {min} characters", HttpStatus.BAD_REQUEST),
    INVALID_EMAIL(1009, "Invalid email address", HttpStatus.BAD_REQUEST),
    EMAIL_IS_REQUIRED(1010, "Email is required", HttpStatus.BAD_REQUEST),
    INVALID_DOB(1008, "Your age must be at least {min} years old", HttpStatus.BAD_REQUEST),

    // Thêm một số validation errors phổ biến
    INVALID_CONFIRM_PASSWORD(1011, "Confirm password must be at least {min} characters", HttpStatus.BAD_REQUEST),
    PASSWORD_MISMATCH(1012, "Password and confirm password do not match", HttpStatus.BAD_REQUEST),
    INVALID_PHONE(1013, "Invalid phone number format", HttpStatus.BAD_REQUEST),
    PHONE_IS_REQUIRED(1014, "Phone number is required", HttpStatus.BAD_REQUEST),

    // Authentication & Authorization
    UNAUTHENTICATED(1006, "Authentication required", HttpStatus.UNAUTHORIZED), // Sửa message rõ ràng hơn
    UNAUTHORIZED(
            1007,
            "You do not have permission to access this resource",
            HttpStatus.FORBIDDEN), // Sửa message rõ ràng hơn
    INVALID_TOKEN(1015, "Invalid or expired token", HttpStatus.UNAUTHORIZED),
    TOKEN_EXPIRED(1016, "Token has expired", HttpStatus.UNAUTHORIZED),

    // Business logic errors
    INSUFFICIENT_BALANCE(1017, "Insufficient account balance", HttpStatus.BAD_REQUEST),
    RESOURCE_NOT_FOUND(1018, "Requested resource not found", HttpStatus.NOT_FOUND),
    DUPLICATE_ENTRY(1019, "Duplicate entry detected", HttpStatus.CONFLICT),

    // File upload errors
    FILE_TOO_LARGE(1020, "File size exceeds maximum limit", HttpStatus.BAD_REQUEST),
    INVALID_FILE_FORMAT(1021, "Invalid file format", HttpStatus.BAD_REQUEST),
    FILE_UPLOAD_FAILED(1022, "File upload failed", HttpStatus.INTERNAL_SERVER_ERROR),

    // Teacher related errors
    TEACHER_EXISTED(1023, "Teacher already exists", HttpStatus.BAD_REQUEST),
    TEACHER_NOT_EXISTED(1024, "Teacher does not exist", HttpStatus.NOT_FOUND),

    // Role errors
    ROLE_NOT_EXISTED(1025, "Role does not exist", HttpStatus.NOT_FOUND);



    ErrorCode(int code, String message, HttpStatusCode statusCode) {
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
    }

    private final int code;
    private final String message;
    private final HttpStatusCode statusCode;
}
