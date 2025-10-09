package com.hcmute.file_service.service;

import com.cloudinary.Cloudinary;
import com.hcmute.file_service.exception.AppException;
import com.hcmute.file_service.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BaseCloudinaryService {
    protected final Cloudinary cloudinary;

    protected Map<String, String> processUploadResult(Map uploadResult) {
        return Map.of(
                "url", uploadResult.get("secure_url").toString(),
                "publicId", uploadResult.get("public_id").toString()
        );
    }

    // validate for files
    protected void validateFile(MultipartFile file, long maxSize, String[] allowedTypes) {
        if (file.isEmpty()) {
            throw new AppException(ErrorCode.FILE_EMPTY);
        }

        if (file.getSize() > maxSize) {
            throw new AppException(ErrorCode.FILE_EXCEED_MAX_SIZE);
        }

        String contentType = file.getContentType();
        if (contentType == null || !Arrays.asList(allowedTypes).contains(contentType)){
            throw new AppException(ErrorCode.FILE_TYPE_NOT_ALLOWED);
        }
    }
}
