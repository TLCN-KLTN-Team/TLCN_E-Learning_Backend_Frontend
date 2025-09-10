package com.hcmute.file_handler.controller;

import com.hcmute.file_handler.dto.response.ApiResponse;
import com.hcmute.file_handler.service.FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/media")
@RequiredArgsConstructor
public class FileController {
    private final FileService fileService;

    @PostMapping("/upload")
    ApiResponse<Object> uploadMedia(@RequestParam("file")MultipartFile file) {
        String fileUrl = fileService.upload(file);
        return ApiResponse.success(
                fileUrl,
                "Upload file thành công"
        );
    }
}
