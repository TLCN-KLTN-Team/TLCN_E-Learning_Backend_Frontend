package com.hcmute.file_handler.service;

import com.cloudinary.Cloudinary;
import com.hcmute.file_handler.exception.AppException;
import com.hcmute.file_handler.exception.ErrorCode;
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
            Map<String, Object> uploadParams = new HashMap<>();
            uploadParams.put("resource_type", "raw");
            uploadParams.put("use_filename", true);
            uploadParams.put("unique_filename", false);

            Map uploadResult = cloudinary.uploader().upload(file.getBytes(), uploadParams);
            return processUploadResult(uploadResult);

        } catch (IOException e) {
            throw new AppException(ErrorCode.DOCUMENT_UPLOAD_FAILED);
        }
    }

    public Map uploadDocumentWithFolder(MultipartFile file, String folderName) {
        validateFile(file, MAX_DOCUMENT_SIZE, ALLOWED_DOCUMENT_TYPES);

        try {
            Map<String, Object> uploadParams = new HashMap<>();
            uploadParams.put("resource_type", "raw");
            uploadParams.put("folder", folderName);
            uploadParams.put("use_filename", true);
            uploadParams.put("unique_filename", false);

            Map uploadResult = cloudinary.uploader().upload(file.getBytes(), uploadParams);
            return processUploadResult(uploadResult);

        } catch (IOException e) {
            throw new AppException(ErrorCode.DOCUMENT_UPLOAD_FAILED);
        }
    }

    public void deleteDocument(String publicId) {
        try {
            Map<String, Object> deleteParams = new HashMap<>();
            deleteParams.put("resource_type", "raw");

            cloudinary.uploader().destroy(publicId, deleteParams);
        } catch (IOException e) {
            throw new AppException(ErrorCode.DOCUMENT_DELETE_FAILED);
        }
    }

}
