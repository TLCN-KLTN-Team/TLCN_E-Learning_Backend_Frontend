package com.hcmute.file_service.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.Transformation;
import com.cloudinary.utils.ObjectUtils;
import com.hcmute.file_service.dto.response.AuthUploadResult;
import com.hcmute.file_service.exception.AppException;
import com.hcmute.file_service.exception.ErrorCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

/**
 * Xử lý upload file lên Cloudinary với type=authenticated (private).
 * File chỉ truy cập được qua signed URL — không có URL công khai.
 * Tập trung toàn bộ logic Cloudinary authenticated tại file-service để các
 * service khác (chat-service, v.v.) gọi qua Feign thay vì tự xử lý.
 */
@Service
@Slf4j
public class CloudinaryAuthService extends BaseCloudinaryService {

    private static final long MAX_FILE_SIZE = 20 * 1024 * 1024L; // 20 MB
    private static final long SIGNED_URL_TTL_SECONDS = 300L;      // 5 phút

    public CloudinaryAuthService(Cloudinary cloudinary) {
        super(cloudinary);
    }

    /**
     * Upload file dưới dạng authenticated (private) lên Cloudinary.
     * Resource type tự phát hiện từ MIME type của file.
     * Trả về secureUrl, publicId, resourceType để caller lưu lại dùng sau.
     */
    public AuthUploadResult uploadAuthenticated(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new AppException(ErrorCode.FILE_EMPTY);
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new AppException(ErrorCode.FILE_EXCEED_MAX_SIZE);
        }

        try {
            String resourceType = resolveResourceType(file.getContentType());
            Map<String, Object> params = ObjectUtils.asMap(
                    "resource_type", resourceType,
                    "type", "authenticated"
            );
            Map result = cloudinary.uploader().upload(file.getBytes(), params);

            return AuthUploadResult.builder()
                    .secureUrl(result.get("secure_url").toString())
                    .publicId(result.get("public_id").toString())
                    .resourceType(result.get("resource_type").toString())
                    .build();

        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Authenticated upload failed for file={}", file.getOriginalFilename(), e);
            throw new AppException(ErrorCode.AUTH_UPLOAD_FAILED);
        }
    }

    /**
     * Tạo signed URL cho một authenticated Cloudinary asset.
     * URL hết hạn sau SIGNED_URL_TTL_SECONDS giây (5 phút).
     * fl_attachment buộc browser tải xuống thay vì mở inline.
     */
    public String generateSignedUrl(String publicId, String resourceType) {
        try {
            return cloudinary.url()
                    .transformation(new Transformation().rawTransformation("fl_attachment"))
                    .resourceType(resourceType)
                    .type("authenticated")
                    .signed(true)
                    .generate(publicId);
        } catch (Exception e) {
            log.error("Failed to generate signed URL for publicId={}, resourceType={}", publicId, resourceType, e);
            throw new AppException(ErrorCode.SIGNED_URL_FAILED);
        }
    }

    private String resolveResourceType(String contentType) {
        if (contentType == null) return "auto";
        if (contentType.startsWith("image/")) return "image";
        if (contentType.startsWith("video/")) return "video";
        return "auto";
    }
}
