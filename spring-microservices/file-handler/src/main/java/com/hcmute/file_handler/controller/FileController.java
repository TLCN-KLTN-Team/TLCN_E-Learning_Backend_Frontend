package com.hcmute.file_handler.controller;

import com.hcmute.file_handler.dto.response.ApiResponse;
import com.hcmute.file_handler.service.FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/media")
@RequiredArgsConstructor
public class FileController {
    private final FileService fileService;

    @PostMapping(value = "/upload", consumes = {"multipart/form-data"})
    ApiResponse<Object> uploadMedia(@RequestPart("file") MultipartFile file) {
        List<String> fileUrl = fileService.upload(file);
        return ApiResponse.success(
                fileUrl,
                "Upload file thành công"
        );
    }

    @PostMapping("/remove/{publicId}")
    ApiResponse<Object> removeMedia(@PathVariable String publicId) {
        fileService.delete(publicId);
        return ApiResponse.success(
                null,
                "Xoá file thành công"
        );
    }
}
