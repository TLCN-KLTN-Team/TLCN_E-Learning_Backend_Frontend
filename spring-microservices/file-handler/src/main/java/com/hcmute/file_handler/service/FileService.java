package com.hcmute.file_handler.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.hcmute.file_handler.exception.AppException;
import com.hcmute.file_handler.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class FileService {
    private final Cloudinary cloudinary;

    public String upload(MultipartFile file) {
        try {
            Map result = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.emptyMap());
            return result.get("secure_url").toString();
        } catch (IOException e) {
            throw new AppException(ErrorCode.CLOUDINARY_UPLOAD_FAILED);
        }
    }

    public String uploadAvatar(MultipartFile file) throws IOException {
        Map options = ObjectUtils.asMap(
                "folder", "avatars",
                "resource_type", "image",
                "overwrite", true
        );
        return doUpload(file, options);
    }

    private String doUpload(MultipartFile file, Map options) {
        try {
            Map result = cloudinary.uploader().upload(file.getBytes(), options);
            return result.get("secure_url").toString();
        } catch (IOException e) {
            throw new AppException(ErrorCode.CLOUDINARY_UPLOAD_FAILED);
        }
    }

}
