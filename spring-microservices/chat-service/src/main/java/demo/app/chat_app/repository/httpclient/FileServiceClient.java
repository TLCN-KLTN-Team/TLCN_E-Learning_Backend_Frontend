package demo.app.chat_app.repository.httpclient;

import demo.app.chat_app.config.AuthenticationRequestInterceptor;
import demo.app.chat_app.dto.response.ApiResponse;
import demo.app.chat_app.dto.response.FileServiceUploadResult;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;

/**
 * Feign client gọi file-service để upload file authenticated lên Cloudinary.
 * Tập trung xử lý Cloudinary tại file-service — chat-service không cần tự upload.
 *
 * AuthenticationRequestInterceptor tự động forward JWT token từ request context
 * (HTTP hoặc WebSocket ThreadLocal) vào header Authorization của Feign call.
 */
@FeignClient(
        name = "fileServiceClient",
        url = "${services.file.url}",
        configuration = {AuthenticationRequestInterceptor.class}
)
public interface FileServiceClient {

    /**
     * Upload file lên Cloudinary dưới dạng authenticated (private).
     * Body là multipart/form-data với part "file" chứa bytes + Content-Type của file.
     * Trả về {secureUrl, publicId, resourceType} để lưu vào MessageAttachment.
     *
     * Dùng MultipartFile thay vì Resource để Spring Cloud OpenFeign tự xử lý
     * multipart encoding (content-type + boundary) chính xác.
     */
    @PostMapping(value = "/media/upload-authenticated", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    ApiResponse<FileServiceUploadResult> uploadAuthenticated(
            @RequestPart("file") MultipartFile file);
}
