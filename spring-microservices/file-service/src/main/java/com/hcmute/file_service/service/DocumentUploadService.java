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
public class DocumentUploadService extends BaseCloudinaryService{
    public DocumentUploadService(Cloudinary cloudinary) {
        super(cloudinary);
    }

    private static final long MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB
    private static final String[] ALLOWED_DOCUMENT_TYPES = {
            "application/pdf", "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "text/plain", "text/csv", "application/zip", "application/rar"
    };

    public Map uploadDocument(MultipartFile file) {
        validateFile(file, MAX_DOCUMENT_SIZE, ALLOWED_DOCUMENT_TYPES);

        try {
            String originalFilename = file.getOriginalFilename();
            if (originalFilename == null) {
                throw new AppException(ErrorCode.INVALID_FILE_NAME);
            }

            // Tách tên file và extension
            int lastDotIndex = originalFilename.lastIndexOf('.');
            String fileNameWithoutExt = lastDotIndex > 0 ?
                    originalFilename.substring(0, lastDotIndex) : originalFilename;
            String fileExtension = lastDotIndex > 0 ?
                    originalFilename.substring(lastDotIndex + 1).toLowerCase() : "";

            // Loại bỏ ký tự đặc biệt
            String cleanFileName = fileNameWithoutExt
                    .replaceAll("[^a-zA-Z0-9_\\-\\p{L}]", "_");

            Map<String, Object> uploadParams = new HashMap<>();

            // ✅ THAY ĐỔI: Dùng "auto" thay vì "raw" để tránh bị block
            uploadParams.put("resource_type", "raw");
            uploadParams.put("public_id", cleanFileName);
            uploadParams.put("use_filename", true);  // Giữ tên file
            uploadParams.put("unique_filename", true); // Thêm UUID tránh trùng
            uploadParams.put("access_mode", "public");

            // Không cần set format khi dùng auto
            // Cloudinary sẽ tự detect

            Map uploadResult = cloudinary.uploader().upload(file.getBytes(), uploadParams);

            // Return kết quả
            Map<String, String> result = new HashMap<>();
            result.put("url", uploadResult.get("secure_url").toString());
            result.put("publicId", uploadResult.get("public_id").toString());
            result.put("originalFilename", originalFilename);
            result.put("format", fileExtension);

            return result;

        } catch (IOException e) {
            throw new AppException(ErrorCode.DOCUMENT_UPLOAD_FAILED);
        }
    }

    public Map uploadDocumentWithFolder(MultipartFile file, String folderName) {
        validateFile(file, MAX_DOCUMENT_SIZE, ALLOWED_DOCUMENT_TYPES);

        try {
            String originalFilename = file.getOriginalFilename();
            if (originalFilename == null) {
                throw new AppException(ErrorCode.INVALID_FILE_NAME);
            }

            int lastDotIndex = originalFilename.lastIndexOf('.');
            String fileNameWithoutExt = lastDotIndex > 0 ?
                    originalFilename.substring(0, lastDotIndex) : originalFilename;
            String fileExtension = lastDotIndex > 0 ?
                    originalFilename.substring(lastDotIndex + 1).toLowerCase() : "";

            String cleanFileName = fileNameWithoutExt
                    .replaceAll("[^a-zA-Z0-9_\\-\\p{L}]", "_");

            Map<String, Object> uploadParams = new HashMap<>();
            uploadParams.put("resource_type", "auto");
            uploadParams.put("folder", folderName);
            uploadParams.put("public_id", cleanFileName);
            uploadParams.put("use_filename", true);
            uploadParams.put("unique_filename", true);

            Map uploadResult = cloudinary.uploader().upload(file.getBytes(), uploadParams);

            Map<String, String> result = new HashMap<>();
            result.put("url", uploadResult.get("secure_url").toString());
            result.put("publicId", uploadResult.get("public_id").toString());
            result.put("originalFilename", originalFilename);
            result.put("format", fileExtension);

            return result;

        } catch (IOException e) {
            throw new AppException(ErrorCode.DOCUMENT_UPLOAD_FAILED);
        }
    }

    public void deleteDocument(String publicId) {
        try {
            // Khi delete cũng cần dùng resource_type phù hợp
            // Thử auto hoặc image/video tùy file type
            Map<String, Object> deleteParams = new HashMap<>();
            deleteParams.put("invalidate", true);

            // Try to delete as raw first
            try {
                deleteParams.put("resource_type", "raw");
                cloudinary.uploader().destroy(publicId, deleteParams);
            } catch (Exception e) {
                // If failed, try as image (for PDFs uploaded with auto)
                deleteParams.put("resource_type", "image");
                cloudinary.uploader().destroy(publicId, deleteParams);
            }
        } catch (IOException e) {
            throw new AppException(ErrorCode.DOCUMENT_DELETE_FAILED);
        }
    }
}