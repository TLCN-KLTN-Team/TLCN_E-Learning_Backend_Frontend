package demo.app.chat_app.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

/**
 * DTO nhận kết quả upload authenticated từ file-service.
 * Ánh xạ với AuthUploadResult trả về bởi file-service /media/upload-authenticated.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class FileServiceUploadResult {
    String secureUrl;
    String publicId;
    String resourceType;
}
