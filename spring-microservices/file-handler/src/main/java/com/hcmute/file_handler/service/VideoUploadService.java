package com.hcmute.file_handler.service;

import com.cloudinary.Cloudinary;
import org.springframework.stereotype.Service;

@Service
public class VideoUploadService extends BaseCloudinaryService{
    public VideoUploadService(Cloudinary cloudinary) {
        super(cloudinary);
    }
}
