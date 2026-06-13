package com.hoangphihiep.exception;

import com.hoangphihiep.dto.response.ApiResponse;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.Map;
import java.util.Objects;

@ControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    private static final String MIN_ATTRIBUTE = "min";

    @ExceptionHandler(value = Exception.class)
    ResponseEntity<ApiResponse> handlingRuntimeException(Exception exception) {
        log.error("Exception: ", exception);
        ApiResponse apiResponse = new ApiResponse();

        apiResponse.setCode(String.valueOf(ErrorCode.UNCATEGORIZED_EXCEPTION.getCode()));
        apiResponse.setMessage(ErrorCode.UNCATEGORIZED_EXCEPTION.getMessage());

        return ResponseEntity.badRequest().body(apiResponse);
    }

    @ExceptionHandler(value = AppException.class)
    ResponseEntity<ApiResponse> handlingAppException(AppException exception) {
        ErrorCode errorCode = exception.getErrorCode();
        ApiResponse apiResponse = new ApiResponse();

        apiResponse.setCode(String.valueOf(errorCode.getCode()));
        apiResponse.setMessage(errorCode.getMessage());

        return ResponseEntity.status(errorCode.getStatusCode()).body(apiResponse);
    }

    @ExceptionHandler(value = MethodArgumentNotValidException.class)
    ResponseEntity<ApiResponse> handlingValidation(MethodArgumentNotValidException exception) {
        String enumKey = exception.getFieldError().getDefaultMessage();

        ErrorCode errorCode = ErrorCode.INVALID_KEY;
        Map<String, Object> attributes = null;
        try {
            errorCode = ErrorCode.valueOf(enumKey);
        } catch (IllegalArgumentException e) {
            // If enumKey is not a valid ErrorCode, use the default message
        }

        ApiResponse apiResponse = new ApiResponse();

        apiResponse.setCode(String.valueOf(errorCode.getCode()));
        apiResponse.setMessage(Objects.nonNull(attributes) ? mapAttribute(errorCode.getMessage(), attributes)
                : enumKey);

        return ResponseEntity.badRequest().body(apiResponse);
    }

    @ExceptionHandler(value = ConstraintViolationException.class)
    ResponseEntity<ApiResponse> handlingConstraintViolationException(ConstraintViolationException exception) {
        ErrorCode errorCode = ErrorCode.INVALID_REQUEST;

        var constraintViolation = exception.getConstraintViolations().stream().findFirst().orElse(null);
        if (constraintViolation != null) {
            String message = constraintViolation.getMessage();
            ApiResponse apiResponse = new ApiResponse();
            apiResponse.setCode(String.valueOf(errorCode.getCode()));
            apiResponse.setMessage(message);
            return ResponseEntity.badRequest().body(apiResponse);
        }

        ApiResponse apiResponse = new ApiResponse();
        apiResponse.setCode(String.valueOf(errorCode.getCode()));
        apiResponse.setMessage(errorCode.getMessage());

        return ResponseEntity.badRequest().body(apiResponse);
    }

    @ExceptionHandler(value = org.springframework.dao.DataIntegrityViolationException.class)
    ResponseEntity<ApiResponse> handlingDataIntegrityViolationException(org.springframework.dao.DataIntegrityViolationException exception) {
        log.error("DataIntegrityViolationException: ", exception);
        ApiResponse apiResponse = new ApiResponse();

        apiResponse.setCode(String.valueOf(ErrorCode.DATA_INTEGRITY_VIOLATION.getCode()));
        
        String message = ErrorCode.DATA_INTEGRITY_VIOLATION.getMessage();
        Throwable rootCause = exception.getRootCause();
        if (rootCause != null) {
            String rootMsg = rootCause.getMessage();
            if (rootMsg != null) {
                if (rootMsg.contains("Data too long") || rootMsg.contains("Data truncation")) {
                    message = "Dữ liệu nhập vào quá dài so với giới hạn cho phép. Vui lòng kiểm tra và rút ngắn lại.";
                } else if (rootMsg.contains("Duplicate entry")) {
                    message = "Dữ liệu đã tồn tại trong hệ thống (trùng mã hoặc giá trị duy nhất).";
                }
            }
        }
        
        apiResponse.setMessage(message);

        return ResponseEntity.badRequest().body(apiResponse);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ApiResponse> handlingRuntimeException(RuntimeException exception) {
        ApiResponse apiResponse = new ApiResponse();
        apiResponse.setCode(ErrorCode.UNCATEGORIZED_EXCEPTION.getCode());
        apiResponse.setMessage(exception.getMessage());

        return ResponseEntity.badRequest().body(apiResponse);
    }

    private String mapAttribute(String message, Map<String, Object> attributes) {
        String minValue = String.valueOf(attributes.get(MIN_ATTRIBUTE));

        return message.replace("{" + MIN_ATTRIBUTE + "}", minValue);
    }
}
