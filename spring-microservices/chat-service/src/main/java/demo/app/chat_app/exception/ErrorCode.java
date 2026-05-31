package demo.app.chat_app.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

/**
 * Hệ thống mã lỗi cho Chat Service với cấu trúc phân loại rõ ràng:
 *
 * 🎯 CẤU TRÚC MÃ LỖI:
 * - SYS_xxxx: Lỗi hệ thống (System Errors)
 * - AUTH_xxxx: Lỗi xác thực và phân quyền (Authentication & Authorization)
 * - USER_xxxx: Lỗi quản lý người dùng (User Management)
 * - CHAT_xxxx: Lỗi nghiệp vụ chat (Chat Business Logic)
 * - FILE_xxxx: Lỗi xử lý file (File Operations)
 * - WS_xxxx: Lỗi workspace (Workspace Management)
 * - CH_xxxx: Lỗi channel (Channel Management)
 * - MSG_xxxx: Lỗi message (Message Management)
 */
@Getter
public enum ErrorCode {
    // Success Response
    SUCCESS("SYS_0000", "Yêu cầu thành công", HttpStatus.OK),

    // System Errors (SYS_xxxx)
    SYSTEM_ERROR("SYS_9999", "Lỗi hệ thống không xác định", HttpStatus.INTERNAL_SERVER_ERROR),
    UNCATEGORIZED_EXCEPTION("SYS_9999", "Uncategorized error", HttpStatus.INTERNAL_SERVER_ERROR),
    JSON_PROCESSING_ERROR("SYS_9998", "Lỗi xử lý JSON", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_REQUEST("SYS_1001", "Yêu cầu không hợp lệ", HttpStatus.BAD_REQUEST),
    NON_EXECUTE("SYS_1002", "Không thể thực hiện yêu cầu", HttpStatus.INTERNAL_SERVER_ERROR),

    // Authentication Errors (AUTH_xxxx)
    INVALID_TOKEN("AUTH_1001", "Token không hợp lệ", HttpStatus.BAD_REQUEST),
    AUTH_TOKEN_INVALID("AUTH_1003", "Token không hợp lệ hoặc đã hết hạn", HttpStatus.UNAUTHORIZED),
    AUTH_TOKEN_EXPIRED("AUTH_1004", "Phiên đăng nhập đã hết hạn", HttpStatus.UNAUTHORIZED),
    UNAUTHENTICATED("AUTH_1002", "Vui lòng đăng nhập để tiếp tục", HttpStatus.UNAUTHORIZED),
    AUTH_REQUIRED("AUTH_1002", "Vui lòng đăng nhập để tiếp tục", HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED("AUTH_1005", "Bạn không có quyền truy cập chức năng này", HttpStatus.FORBIDDEN),
    AUTH_PERMISSION_DENIED("AUTH_1005", "Bạn không có quyền truy cập chức năng này", HttpStatus.FORBIDDEN),
    INSUFFICIENT_PERMISSIONS("AUTH_1006", "Không đủ quyền để thực hiện hành động này", HttpStatus.FORBIDDEN),

    // User Management Errors (USER_xxxx)
    USER_EXISTED("USER_2001", "Người dùng đã tồn tại trong hệ thống", HttpStatus.BAD_REQUEST),
    USER_ALREADY_EXISTS("USER_2001", "Người dùng đã tồn tại trong hệ thống", HttpStatus.BAD_REQUEST),
    USER_NOT_EXISTED("USER_2002", "Không tìm thấy người dùng", HttpStatus.NOT_FOUND),
    USER_NOT_FOUND("USER_2002", "Không tìm thấy người dùng", HttpStatus.NOT_FOUND),
    USERNAME_INVALID("USER_2003", "Tên người dùng phải có ít nhất {min} ký tự", HttpStatus.BAD_REQUEST),
    INVALID_PASSWORD("USER_2004", "Mật khẩu phải có ít nhất {min} ký tự", HttpStatus.BAD_REQUEST),
    USER_NOT_FOUND_FROM_FEIGN_CLIENT("USER_2005", "Không tìm thấy người dùng từ dịch vụ bên ngoài", HttpStatus.NOT_FOUND),
    USER_NOT_FOUND_IN_CHANNEL("USER_2006", "Không tìm thấy người dùng trong kênh", HttpStatus.NOT_FOUND),
    GET_USER_PROFILE_FAILED("USER_2007", "Không thể lấy thông tin người dùng", HttpStatus.INTERNAL_SERVER_ERROR),

    // Workspace Errors (WS_xxxx)
    WORKSPACE_NOT_EXISTED("WS_3001", "Không tìm thấy workspace", HttpStatus.NOT_FOUND),
    WORKSPACE_ALREADY_EXISTS("WS_3002", "Workspace đã tồn tại cho khóa học này", HttpStatus.BAD_REQUEST),

    // Channel Errors (CH_xxxx)
    UN_EXISTING_CHANNEL("CH_4001", "Không tìm thấy kênh", HttpStatus.NOT_FOUND),
    CHANNEL_ALREADY_EXISTS("CH_4002", "Kênh đã tồn tại trong workspace", HttpStatus.BAD_REQUEST),
    GENERAL_CHANNEL_NOT_FOUND("CH_4003", "Không tìm thấy kênh chung trong workspace", HttpStatus.NOT_FOUND),
    CHANNEL_LOCKED("CH_4004", "Kênh đã hết hạn nộp/đã khoá, không thể thực hiện hành động này", HttpStatus.FORBIDDEN),
    INVALID_DEADLINE_RANGE("CH_4005", "Hạn chấm chéo phải sau hạn nộp ít nhất 1 giờ", HttpStatus.BAD_REQUEST),
    NOT_ENOUGH_GROUPS_FOR_CROSS_REVIEW("CH_4006", "Cần tối thiểu 2 nhóm để bật chấm chéo", HttpStatus.BAD_REQUEST),
    NO_CROSS_REVIEW_TARGET("CH_4007", "Kênh này chưa được phân công chấm chéo", HttpStatus.NOT_FOUND),
    CROSS_REVIEW_NOT_ALLOWED("CH_4008", "Kênh này không bật chế độ chấm chéo", HttpStatus.BAD_REQUEST),
    SUBMISSION_DEADLINE_REQUIRED("CH_4009", "Hạn nộp bài là bắt buộc", HttpStatus.BAD_REQUEST),
    CROSS_REVIEW_NOT_MEMBER("CH_4010", "Bạn không thuộc nhóm chấm chéo này", HttpStatus.FORBIDDEN),
    CROSS_REVIEW_SCORE_INVALID("CH_4011", "Điểm phải nằm trong khoảng 0 – 10", HttpStatus.BAD_REQUEST),

    // Message Errors (MSG_xxxx)
    MESSAGE_NOT_FOUND("MSG_5001", "Không tìm thấy tin nhắn", HttpStatus.NOT_FOUND),
    MESSAGES_EMPTY("MSG_5002", "Cuộc trò chuyện chưa bắt đầu", HttpStatus.NOT_FOUND),
    SEND_MESSAGE_FAILED("MSG_5003", "Không thể gửi tin nhắn", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_MESSAGE_STATUS("MSG_5004", "Trạng thái tin nhắn không hợp lệ", HttpStatus.BAD_REQUEST),

    // File Errors (FILE_xxxx)
    FILE_EMPTY("FILE_6001", "File trống", HttpStatus.BAD_REQUEST),
    FILE_SIZE_TOO_LARGE("FILE_6002", "Kích thước file vượt quá giới hạn", HttpStatus.PAYLOAD_TOO_LARGE),
    FILE_TYPE_NOT_SUPPORTED("FILE_6003", "Loại file không được hỗ trợ", HttpStatus.UNSUPPORTED_MEDIA_TYPE),
    CLOUDINARY_IO_EXCEPTION("FILE_6004", "Lỗi IO Cloudinary", HttpStatus.INTERNAL_SERVER_ERROR),
    CLOUDINARY_UPLOAD_FAILED("FILE_6005", "Không thể tải file lên Cloudinary", HttpStatus.INTERNAL_SERVER_ERROR),
    CLOUDINARY_DELETE_FAILED("FILE_6006", "Không thể xóa file từ Cloudinary", HttpStatus.INTERNAL_SERVER_ERROR),
    ATTACHMENT_NOT_FOUND("FILE_6007", "Không tìm thấy file đính kèm", HttpStatus.NOT_FOUND),
    UPLOAD_IN_PROGRESS("FILE_6008", "Đang tải file lên", HttpStatus.ACCEPTED),
    FILE_UPLOAD_FAILED("FILE_6009", "Tải file lên thất bại", HttpStatus.INTERNAL_SERVER_ERROR),

    // Group & Section Errors (CHAT_xxxx)
    UN_EXISTING_GROUP("CHAT_7001", "Không tìm thấy nhóm", HttpStatus.NOT_FOUND),
    SECTION_NOT_EXISTED("CHAT_7002", "Không tìm thấy section", HttpStatus.NOT_FOUND),
    END_TIME_INVALID("CHAT_7003", "Thời gian kết thúc phải là thời điểm trong tương lai", HttpStatus.BAD_REQUEST),

    MEMBER_NOT_FOUND("CHAT_8001", "Không tìm thấy thành viên trong kênh", HttpStatus.NOT_FOUND),

    ;

    ErrorCode(String code, String message, HttpStatusCode statusCode) {
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
    }

    private final String code;
    private final String message;
    private final HttpStatusCode statusCode;
}
