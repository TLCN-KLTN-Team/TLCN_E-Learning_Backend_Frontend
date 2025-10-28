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
public class ImageUploadService extends BaseCloudinaryService {

    public ImageUploadService(Cloudinary cloudinary) {
        super(cloudinary);
    }

    private static final long MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
    private static final String[] ALLOWED_IMAGE_TYPES = {
            "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/bmp"
    };

    /**
     * Upload ảnh cơ bản
     */
    public Map uploadImage(MultipartFile file) {
        validateFile(file, MAX_IMAGE_SIZE, ALLOWED_IMAGE_TYPES);

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
            uploadParams.put("resource_type", "image");
            uploadParams.put("public_id", cleanFileName);
            uploadParams.put("use_filename", true);
            uploadParams.put("unique_filename", true);
            uploadParams.put("access_mode", "public");

            // Tối ưu ảnh
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
            throw new AppException(ErrorCode.IMAGE_UPLOAD_FAILED);
        }
    }

    /**
     * Upload ảnh vào thư mục cụ thể
     */
    public Map uploadImageWithFolder(MultipartFile file, String folderName) {
        validateFile(file, MAX_IMAGE_SIZE, ALLOWED_IMAGE_TYPES);

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
            uploadParams.put("resource_type", "image");
            uploadParams.put("folder", folderName);
            uploadParams.put("public_id", cleanFileName);
            uploadParams.put("use_filename", true);
            uploadParams.put("unique_filename", true);
            uploadParams.put("access_mode", "public");
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
            throw new AppException(ErrorCode.IMAGE_UPLOAD_FAILED);
        }
    }

    /**
     * Xóa ảnh trên Cloudinary
     */
    public void deleteImage(String publicId) {
        try {
            Map<String, Object> deleteParams = new HashMap<>();
            deleteParams.put("resource_type", "image");
            deleteParams.put("invalidate", true);
            cloudinary.uploader().destroy(publicId, deleteParams);
        } catch (IOException e) {
            throw new AppException(ErrorCode.IMAGE_DELETE_FAILED);
        }
    }
}
