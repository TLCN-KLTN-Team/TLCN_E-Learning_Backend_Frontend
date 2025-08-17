package com.hoangphihiep.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
public enum ErrorCode {
    UNCATEGORIZED_EXCEPTION(9999, "Lỗi không xác định", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_KEY(1001, "Khóa không hợp lệ", HttpStatus.BAD_REQUEST),
    INSTRUCTOR_NOT_EXISTED(1002, "Giảng viên không tồn tại", HttpStatus.NOT_FOUND),
    INSTRUCTOR_CODE_EXISTED(1003, "Mã giảng viên đã tồn tại", HttpStatus.BAD_REQUEST),
    EMAIL_EXISTED(1004, "Email đã tồn tại", HttpStatus.BAD_REQUEST),
    INVALID_REQUEST(1005, "Yêu cầu không hợp lệ", HttpStatus.BAD_REQUEST),
    UNAUTHORIZED(1006, "Không có quyền truy cập", HttpStatus.UNAUTHORIZED),
    FORBIDDEN(1007, "Bị cấm truy cập", HttpStatus.FORBIDDEN),
    ;

    ErrorCode(int code, String message, HttpStatusCode statusCode) {
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
    }

    private final int code;
    private final String message;
    private final HttpStatusCode statusCode;
}
