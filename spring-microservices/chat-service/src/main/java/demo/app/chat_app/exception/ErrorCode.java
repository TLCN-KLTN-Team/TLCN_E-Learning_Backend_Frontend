package demo.app.chat_app.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
public enum ErrorCode {
    UNCATEGORIZED_EXCEPTION(9999, "Uncategorized error", HttpStatus.INTERNAL_SERVER_ERROR),
    JSON_PROCESSING_ERROR(9998, "Lỗi xử lý JSON", HttpStatus.INTERNAL_SERVER_ERROR),


    INVALID_TOKEN(1001, "Invalid token", HttpStatus.BAD_REQUEST),
    USER_EXISTED(1002, "User existed", HttpStatus.BAD_REQUEST),
    USERNAME_INVALID(1003, "Username must be at least {min} characters", HttpStatus.BAD_REQUEST),
    INVALID_PASSWORD(1004, "Password must be at least {min} characters", HttpStatus.BAD_REQUEST),
    USER_NOT_EXISTED(1005, "User not existed", HttpStatus.NOT_FOUND),
    UNAUTHENTICATED(1006, "Unauthenticated", HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED(1007, "You do not have permission", HttpStatus.FORBIDDEN),
    UN_EXISTING_CHANNEL(1007, "Channel not existed", HttpStatus.NOT_FOUND),
    MESSAGES_EMPTY(1008, "Conversation don't begin", HttpStatus.NOT_FOUND),
    WORKSPACE_NOT_EXISTED(1009, "Workspace not existed", HttpStatus.NOT_FOUND),
    USER_NOT_FOUND_FROM_FEIGN_CLIENT(1010, "User not found from foreign client", HttpStatus.NOT_FOUND),
    USER_NOT_FOUND_IN_CHANNEL(1011, "User not found in channel", HttpStatus.NOT_FOUND),
    WORKSPACE_ALREADY_EXISTS(1012, "Workspace already exists for this course", HttpStatus.BAD_REQUEST),
    CHANNEL_ALREADY_EXISTS(1013, "Channel already exists in workspace", HttpStatus.BAD_REQUEST),
    MESSAGE_NOT_FOUND(1014, "Message not found", HttpStatus.NOT_FOUND),
    INSUFFICIENT_PERMISSIONS(1015, "Insufficient permissions to perform this action", HttpStatus.FORBIDDEN),
    SEND_MESSAGE_FAILED(1016, "Failed to send message", HttpStatus.INTERNAL_SERVER_ERROR),
    FILE_SIZE_TOO_LARGE(1017, "File size exceeds the limit or empty", HttpStatus.PAYLOAD_TOO_LARGE),
    FILE_TYPE_NOT_SUPPORTED(1018, "File type not supported", HttpStatus.UNSUPPORTED_MEDIA_TYPE),
    CLOUDINARY_IO_EXCEPTION(1019, "Cloudinary IO exception", HttpStatus.INTERNAL_SERVER_ERROR),
    CLOUDINARY_UPLOAD_FAILED(1019, "Failed to upload file to Cloudinary", HttpStatus.INTERNAL_SERVER_ERROR),
    CLOUDINARY_DELETE_FAILED(1024, "Failed to delete file from Cloudinary", HttpStatus.INTERNAL_SERVER_ERROR),
    FILE_EMPTY(1020, "File is empty", HttpStatus.BAD_REQUEST),
    INVALID_MESSAGE_STATUS(1021, "Invalid message status", HttpStatus.BAD_REQUEST),
    ATTACHMENT_NOT_FOUND(1022, "Attachment not found", HttpStatus.NOT_FOUND),
    UPLOAD_IN_PROGRESS(1023, "Upload is in progress", HttpStatus.ACCEPTED),

    END_TIME_INVALID(1025, "End time must be in the future", HttpStatus.BAD_REQUEST),

    UN_EXISTING_GROUP(1026, "Group not existed", HttpStatus.NOT_FOUND)
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
