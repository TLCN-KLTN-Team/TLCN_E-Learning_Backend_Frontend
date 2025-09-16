package com.hcmute.file_handler.service;

import com.hcmute.file_handler.exception.AppException;
import com.hcmute.file_handler.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class FileService {
    private final ImageUploadService imageUploadService;
    private final DocumentUploadService documentUploadService;
    private final VideoUploadService videoUploadService;

    public Map uploadFile(MultipartFile file, String fileType) {
        switch (fileType.toLowerCase()) {
            case "image":
                return imageUploadService.uploadImage(file);
            case "video":
                //return videoUploadService.uploadVideo(file);
            case "document":
                return documentUploadService.uploadDocument(file);
            default:
                throw new AppException(ErrorCode.UNSUPPORTED_FILE_TYPE);
        }
    }

    public Map uploadFileAuto(MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType == null) {
            throw new AppException(ErrorCode.UNKNOWN_FILE_TYPE);
        }

        if (contentType.startsWith("image/")) {
            return imageUploadService.uploadImage(file);
        } else if (contentType.startsWith("video/")) {
            //return videoUploadService.uploadVideo(file);
            return null;
        } else {
            return documentUploadService.uploadDocument(file);
        }
    }

    public void deleteFile(String publicId, String fileType) {
        switch (fileType.toLowerCase()) {
            case "image":
                imageUploadService.deleteImage(publicId);
                break;
            case "video":
                //videoUploadService.deleteVideo(publicId);
                break;
            case "document":
                documentUploadService.deleteDocument(publicId);
                break;
            default:
                throw new AppException(ErrorCode.UNSUPPORTED_FILE_TYPE);
        }
    }
}
