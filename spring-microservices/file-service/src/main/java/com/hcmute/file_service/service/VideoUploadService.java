package com.hcmute.file_service.service;

import com.cloudinary.Cloudinary;
import com.hcmute.file_service.exception.AppException;
import com.hcmute.file_service.exception.ErrorCode;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Service
public class VideoUploadService extends BaseCloudinaryService {

    public VideoUploadService(Cloudinary cloudinary) {
        super(cloudinary);
    }

    private static final long MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
    private static final String[] ALLOWED_VIDEO_TYPES = {
            "video/mp4",
            "video/mpeg",
            "video/quicktime",  // .mov
            "video/x-msvideo",  // .avi
            "video/x-ms-wmv",   // .wmv
            "video/webm",
            "video/x-flv",      // .flv
            "video/3gpp",       // .3gp
            "video/x-matroska"  // .mkv
    };

    /**
     * Upload video cơ bản
     */
    public Map uploadVideo(MultipartFile file) {
        validateFile(file, MAX_VIDEO_SIZE, ALLOWED_VIDEO_TYPES);

        try {
            String originalFilename = file.getOriginalFilename();
            if (originalFilename == null) {
                throw new AppException(ErrorCode.INVALID_FILE_NAME);
            }

            // Tách tên file và phần mở rộng
            int lastDotIndex = originalFilename.lastIndexOf('.');
            String fileNameWithoutExt = lastDotIndex > 0
                    ? originalFilename.substring(0, lastDotIndex)
                    : originalFilename;
            String fileExtension = lastDotIndex > 0
                    ? originalFilename.substring(lastDotIndex + 1).toLowerCase()
                    : "";

            // Làm sạch tên file (loại bỏ ký tự đặc biệt)
            String cleanFileName = fileNameWithoutExt.replaceAll("[^a-zA-Z0-9_\\-\\p{L}]", "_");

            Map<String, Object> uploadParams = new HashMap<>();
            uploadParams.put("resource_type", "video");
            uploadParams.put("public_id", cleanFileName); // giữ lại .mp4, .mov,...
            uploadParams.put("use_filename", true);
            uploadParams.put("unique_filename", true);
            uploadParams.put("access_mode", "public");
            uploadParams.put("chunk_size", 6_000_000); // 6MB
            uploadParams.put("quality", "auto");
            uploadParams.put("fetch_format", "auto");

            Map uploadResult = cloudinary.uploader().upload(file.getBytes(), uploadParams);

            // Trả về thông tin chi tiết
            Map<String, String> result = new HashMap<>();
            result.put("url", uploadResult.get("secure_url").toString());
            result.put("publicId", uploadResult.get("public_id").toString());
            result.put("originalFilename", originalFilename);
            result.put("format", fileExtension);

            return result;

        } catch (IOException e) {
            throw new AppException(ErrorCode.VIDEO_UPLOAD_FAILED);
        }
    }

    /**
     * Upload video với thư mục cụ thể
     */
    public Map uploadVideoWithFolder(MultipartFile file, String folderName) {
        validateFile(file, MAX_VIDEO_SIZE, ALLOWED_VIDEO_TYPES);

        try {
            String originalFilename = file.getOriginalFilename();
            if (originalFilename == null) {
                throw new AppException(ErrorCode.INVALID_FILE_NAME);
            }

            int lastDotIndex = originalFilename.lastIndexOf('.');
            String fileNameWithoutExt = lastDotIndex > 0
                    ? originalFilename.substring(0, lastDotIndex)
                    : originalFilename;
            String fileExtension = lastDotIndex > 0
                    ? originalFilename.substring(lastDotIndex + 1).toLowerCase()
                    : "";

            String cleanFileName = fileNameWithoutExt.replaceAll("[^a-zA-Z0-9_\\-\\p{L}]", "_");

            Map<String, Object> uploadParams = new HashMap<>();
            uploadParams.put("resource_type", "video");
            uploadParams.put("folder", folderName);
            uploadParams.put("public_id", cleanFileName + "." + fileExtension);
            uploadParams.put("use_filename", true);
            uploadParams.put("unique_filename", true);
            uploadParams.put("access_mode", "public");
            uploadParams.put("chunk_size", 6_000_000);
            uploadParams.put("quality", "auto");
            uploadParams.put("fetch_format", "auto");

            Map uploadResult = cloudinary.uploader().upload(file.getBytes(), uploadParams);

            Map<String, String> result = new HashMap<>();
            result.put("url", uploadResult.get("secure_url").toString());
            result.put("publicId", uploadResult.get("public_id").toString());
            result.put("originalFilename", originalFilename);
            result.put("format", fileExtension);

            return result;

        } catch (IOException e) {
            throw new AppException(ErrorCode.VIDEO_UPLOAD_FAILED);
        }
    }

    /**
     * Xóa video từ Cloudinary
     */
    public void deleteVideo(String publicId) {
        try {
            Map<String, Object> deleteParams = new HashMap<>();
            deleteParams.put("resource_type", "video");
            deleteParams.put("invalidate", true);

            cloudinary.uploader().destroy(publicId, deleteParams);
        } catch (IOException e) {
            throw new AppException(ErrorCode.VIDEO_DELETE_FAILED);
        }
    }
}
