package com.devteria.identity.exception;

import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

import jakarta.validation.ConstraintViolation;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import com.devteria.identity.dto.request.ApiResponse;

import lombok.extern.slf4j.Slf4j;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    private static final String MIN_ATTRIBUTE = "min";

    @ExceptionHandler(value = AppException.class)
    ResponseEntity<ApiResponse> handlingAppException(AppException exception) {
        ErrorCode errorCode = exception.getErrorCode();

        return ResponseEntity.status(errorCode.getStatusCode())
                .body(ApiResponse.builder()
                        .code(errorCode.getCode())
                        .status(errorCode.getStatusCode().value())
                        .message(errorCode.getMessage())
                        .build());
    }

    @ExceptionHandler(value = Exception.class)
    ResponseEntity<ApiResponse> handlingRuntimeException(RuntimeException exception) {
        log.error("Runtime exception: ", exception);
        ErrorCode errorCode = ErrorCode.SYSTEM_ERROR;

        return ResponseEntity.status(errorCode.getStatusCode())
                .body(ApiResponse.builder()
                        .code(errorCode.getCode())
                        .message(errorCode.getMessage())
                        .status(errorCode.getStatusCode().value())
                        .build());
    }

    @ExceptionHandler(value = AccessDeniedException.class)
    ResponseEntity<ApiResponse> handlingAccessDeniedException(AccessDeniedException exception) {
        ErrorCode errorCode = ErrorCode.AUTH_PERMISSION_DENIED;

        return ResponseEntity.status(errorCode.getStatusCode())
                .body(ApiResponse.builder()
                        .code(errorCode.getCode())
                        .message(errorCode.getMessage())
                        .status(errorCode.getStatusCode().value())
                        .build());
    }

    @ExceptionHandler(value = MaxUploadSizeExceededException.class)
    ResponseEntity<ApiResponse> handlingMaxSizeException(MaxUploadSizeExceededException exception) {
        ErrorCode errorCode = ErrorCode.PAYLOAD_TO_LARGE;

        return ResponseEntity.status(errorCode.getStatusCode())
                .body(ApiResponse.builder()
                        .code(errorCode.getCode())
                        .message(errorCode.getMessage())
                        .status(errorCode.getStatusCode().value())
                        .build());
    }

    // 1. Xử lý validation errors (bean validation)
    @ExceptionHandler(value = MethodArgumentNotValidException.class)
    ResponseEntity<ApiResponse> handlingValidation(MethodArgumentNotValidException exception) {
        // Lấy field error đầu tiên để xác định error code chính
        String enumKey = exception.getFieldError().getDefaultMessage();

        ErrorCode errorCode = ErrorCode.INVALID_REQUEST;
        Map<String, Object> attributes = null;

        try {
            errorCode = ErrorCode.valueOf(enumKey);

            var constraintViolation =
                    exception.getBindingResult().getAllErrors().getFirst().unwrap(ConstraintViolation.class);

            attributes = constraintViolation.getConstraintDescriptor().getAttributes();
            log.info("Validation attributes: {}", attributes);

        } catch (IllegalArgumentException e) {
            log.warn("Invalid error code key: {}", enumKey);
        }

        // Collect all field errors for detailed response
        Map<String, String> fieldErrors = new HashMap<>();
        Map<String, Object> finalAttributes = attributes;
        exception.getBindingResult().getFieldErrors().forEach(error -> {
            String fieldName = error.getField();
            String errorMessage = error.getDefaultMessage();

            try {
                ErrorCode fieldErrorCode = ErrorCode.valueOf(errorMessage);
                // Apply attribute mapping if needed
                String finalMessage = Objects.nonNull(finalAttributes)
                        ? mapAttribute(fieldErrorCode.getMessage(), finalAttributes)
                        : fieldErrorCode.getMessage();
                fieldErrors.put(fieldName, finalMessage);
            } catch (IllegalArgumentException ex) {
                fieldErrors.put(fieldName, errorMessage);
            }
        });

        ApiResponse apiResponse = ApiResponse.builder()
                .code(ErrorCode.VALID_EXCEPTION.getCode())
                .status(ErrorCode.VALID_EXCEPTION.getStatusCode().value())
                .message(
                        Objects.nonNull(attributes)
                                ? mapAttribute(errorCode.getMessage(), attributes)
                                : errorCode.getMessage())
                .errors(fieldErrors) // Thêm chi tiết lỗi từng field
                .build();

        return ResponseEntity.badRequest().body(apiResponse);
    }

    private String mapAttribute(String message, Map<String, Object> attributes) {
        String minValue = String.valueOf(attributes.get(MIN_ATTRIBUTE));

        return message.replace("{" + MIN_ATTRIBUTE + "}", minValue);
    }
}
