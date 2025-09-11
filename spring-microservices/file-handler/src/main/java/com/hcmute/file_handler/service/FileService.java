package com.hcmute.file_handler.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.hcmute.file_handler.exception.AppException;
import com.hcmute.file_handler.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class FileService {
    private final Cloudinary cloudinary;

    public List<String> upload(MultipartFile file) {
        try {
            Map uploader = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.emptyMap());
            List<String> result = new ArrayList<>();
            result.add(uploader.get("secure_url").toString()); // URL để hiển thị
            result.add(uploader.get("public_id").toString()); // Public ID để xóa file
            return result;
        } catch (IOException e) {
            throw new AppException(ErrorCode.CLOUDINARY_UPLOAD_FAILED);
        }
    }

    public void delete(String publicId) {
        try {
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
        } catch (IOException e) {
            throw new AppException(ErrorCode.CLOUDINARY_DELETE_FAILED);
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
