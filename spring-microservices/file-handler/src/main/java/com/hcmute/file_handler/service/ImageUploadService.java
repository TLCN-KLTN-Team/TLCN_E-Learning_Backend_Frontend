package com.hcmute.file_handler.service;

import com.cloudinary.Cloudinary;
import com.hcmute.file_handler.exception.AppException;
import com.hcmute.file_handler.exception.ErrorCode;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ImageUploadService extends BaseCloudinaryService{

    public ImageUploadService(Cloudinary cloudinary) {
        super(cloudinary);
    }

    private final static long MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
    private static final String[] ALLOWED_IMAGE_TYPES = {
            "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/bmp"
    };

    public Map uploadImage(MultipartFile file) {
        validateFile(file, MAX_IMAGE_SIZE, ALLOWED_IMAGE_TYPES);

        try {
            Map<String, Object> uploadParams = new HashMap<>();
            uploadParams.put("resource_type", "image");

            Map uploadResult = cloudinary.uploader().upload(file.getBytes(), uploadParams);
            return processUploadResult(uploadResult);

        } catch (IOException e) {
            throw new AppException(ErrorCode.IMAGE_UPLOAD_FAILED);
        }
    }

    public void deleteImage(String publicId) {
        try {
            Map<String, Object> deleteParams = new HashMap<>();
            deleteParams.put("resource_type", "image");

            cloudinary.uploader().destroy(publicId, deleteParams);
        } catch (IOException e) {
            throw new AppException(ErrorCode.IMAGE_DELETE_FAILED);
        }
    }

}
