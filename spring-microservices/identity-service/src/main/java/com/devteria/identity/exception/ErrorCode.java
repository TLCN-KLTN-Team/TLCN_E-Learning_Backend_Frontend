package com.devteria.identity.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

import lombok.Getter;

/**
 * Hệ thống mã lỗi có cấu trúc rõ ràng để frontend dễ phân loại và xử lý:
 *
 * 🎯 CẤU TRÚC MÃ LỖI:
 * - SYS_xxxx: Lỗi hệ thống (System Errors)
 * - AUTH_xxxx: Lỗi xác thực và phân quyền (Authentication & Authorization)
 * - USER_xxxx: Lỗi quản lý người dùng (User Management)
 * - VALID_xxxx: Lỗi validation dữ liệu (Validation Errors)
 * - BIZ_xxxx: Lỗi logic nghiệp vụ (Business Logic)
 * - FILE_xxxx: Lỗi xử lý file (File Operations)
 * - TEACHER_xxxx: Lỗi quản lý giảng viên (Teacher Management)
 * - ROLE_xxxx: Lỗi quản lý vai trò (Role Management)
 *
 * 📋 HƯỚNG DẪN SỬ DỤNG CHO FRONTEND:
 * - Kiểm tra prefix của error code để biết loại lỗi
 * - Hiển thị message trực tiếp cho user (đã dịch tiếng Việt)
 * - Xử lý logic tương ứng với từng loại lỗi
 *
 * 💡 VÍ DỤ:
 * - "AUTH_1001" → Hiển thị form đăng nhập
 * - "VALID_3004" → Focus vào field password
 * - "USER_2001" → Hiển thị suggestion tên khác
 */
@Getter
public enum ErrorCode {
    // Success Response
    SUCCESS("SYS_0000", "Yêu cầu thành công", HttpStatus.OK),

    // System Errors (SYS_xxxx)
    SYSTEM_ERROR("SYS_9999", "Lỗi hệ thống không xác định", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_REQUEST("SYS_1001", "Yêu cầu không hợp lệ", HttpStatus.BAD_REQUEST),

    // Authentication Errors (AUTH_xxxx)
    AUTH_INVALID_CREDENTIALS("AUTH_1001", "Tên đăng nhập hoặc mật khẩu không chính xác", HttpStatus.UNAUTHORIZED),
    AUTH_REQUIRED("AUTH_1002", "Vui lòng đăng nhập để tiếp tục", HttpStatus.UNAUTHORIZED),
    AUTH_TOKEN_INVALID("AUTH_1003", "Token không hợp lệ hoặc đã hết hạn", HttpStatus.UNAUTHORIZED),
    AUTH_TOKEN_EXPIRED("AUTH_1004", "Phiên đăng nhập đã hết hạn", HttpStatus.UNAUTHORIZED),
    AUTH_PERMISSION_DENIED("AUTH_1005", "Bạn không có quyền truy cập chức năng này", HttpStatus.FORBIDDEN),

    // User Management Errors (USER_xxxx)
    USER_ALREADY_EXISTS("USER_2001", "Người dùng đã tồn tại trong hệ thống", HttpStatus.BAD_REQUEST),
    USER_NOT_FOUND("USER_2002", "Không tìm thấy người dùng", HttpStatus.NOT_FOUND),
    USER_EMAIL_EXISTED("USER_2003", "Email đã được sử dụng bởi tài khoản khác", HttpStatus.BAD_REQUEST),
    USER_USERNAME_EXISTED("USER_2004", "Tên đăng nhập đã được sử dụng", HttpStatus.BAD_REQUEST),

    // Validation Errors (VALID_xxxx)
    VALID_EXCEPTION("VALID_3000", "Dữ liệu không hợp lệ", HttpStatus.BAD_REQUEST),
    VALID_USERNAME_REQUIRED("VALID_3001", "Tên đăng nhập không được để trống", HttpStatus.BAD_REQUEST),
    VALID_USERNAME_MIN_LENGTH("VALID_3002", "Tên đăng nhập phải có ít nhất {min} ký tự", HttpStatus.BAD_REQUEST),
    VALID_PASSWORD_REQUIRED("VALID_3003", "Mật khẩu không được để trống", HttpStatus.BAD_REQUEST),
    VALID_PASSWORD_MIN_LENGTH("VALID_3004", "Mật khẩu phải có ít nhất {min} ký tự", HttpStatus.BAD_REQUEST),
    VALID_EMAIL_REQUIRED("VALID_3005", "Email không được để trống", HttpStatus.BAD_REQUEST),
    VALID_EMAIL_INVALID("VALID_3006", "Định dạng email không hợp lệ", HttpStatus.BAD_REQUEST),
    VALID_DOB_INVALID("VALID_3007", "Tuổi phải từ {min} tuổi trở lên", HttpStatus.BAD_REQUEST),
    VALID_CONFIRM_PASSWORD_REQUIRED("VALID_3008", "Xác nhận mật khẩu không được để trống", HttpStatus.BAD_REQUEST),
    VALID_CONFIRM_PASSWORD_MIN_LENGTH(
            "VALID_3009", "Xác nhận mật khẩu phải có ít nhất {min} ký tự", HttpStatus.BAD_REQUEST),
    VALID_PASSWORD_MISMATCH("VALID_3010", "Mật khẩu và xác nhận mật khẩu không khớp", HttpStatus.BAD_REQUEST),
    VALID_PHONE_REQUIRED("VALID_3011", "Số điện thoại không được để trống", HttpStatus.BAD_REQUEST),
    VALID_PHONE_INVALID("VALID_3012", "Định dạng số điện thoại không hợp lệ", HttpStatus.BAD_REQUEST),

    // Business Logic Errors (BIZ_xxxx)
    BIZ_INSUFFICIENT_BALANCE("BIZ_4001", "Số dư tài khoản không đủ", HttpStatus.BAD_REQUEST),
    BIZ_RESOURCE_NOT_FOUND("BIZ_4002", "Không tìm thấy tài nguyên yêu cầu", HttpStatus.NOT_FOUND),
    BIZ_DUPLICATE_ENTRY("BIZ_4003", "Dữ liệu đã tồn tại", HttpStatus.CONFLICT),

    // File Upload Errors (FILE_xxxx)
    FILE_SIZE_TOO_LARGE("FILE_5001", "Kích thước file vượt quá giới hạn cho phép", HttpStatus.BAD_REQUEST),
    FILE_FORMAT_INVALID("FILE_5002", "Định dạng file không được hỗ trợ", HttpStatus.BAD_REQUEST),
    FILE_UPLOAD_FAILED("FILE_5003", "Tải file lên thất bại", HttpStatus.INTERNAL_SERVER_ERROR),

    // Teacher Management Errors (TEACHER_xxxx)
    TEACHER_ALREADY_EXISTS("TEACHER_6001", "Giảng viên đã tồn tại trong hệ thống", HttpStatus.BAD_REQUEST),
    TEACHER_NOT_FOUND("TEACHER_6002", "Không tìm thấy thông tin giảng viên", HttpStatus.NOT_FOUND),

    // Role Management Errors (ROLE_xxxx)
    ROLE_NOT_FOUND("ROLE_7001", "Không tìm thấy vai trò", HttpStatus.NOT_FOUND),
    ROLE_ALREADY_EXISTS("ROLE_7002", "Vai trò đã tồn tại", HttpStatus.BAD_REQUEST);

    ErrorCode(String code, String message, HttpStatusCode statusCode) {
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
    }

    private final String code;
    private final String message;
    private final HttpStatusCode statusCode;
}
