package demo.app.chat_app.service.util;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import demo.app.chat_app.exception.AppException;
import demo.app.chat_app.exception.ErrorCode;
import demo.app.chat_app.model.enums.AttachmentType;
import demo.app.chat_app.model.enums.MessageType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CloudinaryService {
    private final Cloudinary cloudinary;

    private Map<String, Object> getUploadParams(MessageType type) {
        return ObjectUtils.asMap(
                "resource_type", type == MessageType.IMAGE ? "image" : "auto"
        );
    }

    public String uploadFile(MultipartFile file, MessageType type) throws IOException {
        try{
            Map result = cloudinary.uploader().upload(file.getBytes(), getUploadParams(type));
            return result.get("secure_url").toString();
        }catch (Exception ex){
            log.error("Failed to upload file {} to Cloudinary", file.getOriginalFilename(), ex);
            throw new AppException(ErrorCode.CLOUDINARY_UPLOAD_FAILED);
        }
    }

    public void deleteFile(String publicId, MessageType type) {
        try {

            Map result = cloudinary.uploader().destroy(publicId, getUploadParams(type));
        } catch (Exception e) {
            throw new AppException(ErrorCode.CLOUDINARY_DELETE_FAILED);
        }
    }

    /**
     * Extract public_id from Cloudinary URL
     * Example: https://res.cloudinary.com/demo/image/upload/v1234567890/sample.jpg -> sample
     */
    public String extractPublicIdFromUrl(String cloudinaryUrl) {
        if (cloudinaryUrl == null || cloudinaryUrl.isEmpty()) {
            return null;
        }
        
        try {
            // Split by '/' and get the last part (filename with extension)
            String[] parts = cloudinaryUrl.split("/");
            String filename = parts[parts.length - 1];
            
            // Remove file extension to get public_id
            int lastDotIndex = filename.lastIndexOf('.');
            return lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;
        } catch (Exception e) {
            log.error("Failed to extract public_id from URL: {}", cloudinaryUrl, e);
            return null;
        }
    }
}
