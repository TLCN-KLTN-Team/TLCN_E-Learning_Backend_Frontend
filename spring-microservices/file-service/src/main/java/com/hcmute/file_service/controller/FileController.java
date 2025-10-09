package com.hcmute.file_service.controller;

import com.hcmute.file_service.service.FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/media")
@RequiredArgsConstructor
public class FileController {
    private final FileService fileService;

    @PostMapping(value = "/upload", consumes = {"multipart/form-data"})
    public Map<String, String> uploadMedia(@RequestPart("file") MultipartFile file) {
        return fileService.uploadFileAuto(file);
    }

    @PostMapping("/remove-image/{publicId}")
    public void removeImage(@PathVariable String publicId) {
        fileService.deleteFile(publicId, "image");
    }
}
