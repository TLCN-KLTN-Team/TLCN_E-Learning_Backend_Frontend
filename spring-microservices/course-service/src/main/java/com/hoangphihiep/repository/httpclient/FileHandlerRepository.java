package com.hoangphihiep.repository.httpclient;

import com.hoangphihiep.config.FeignClientConfig;
import com.hoangphihiep.dto.response.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@FeignClient(
        name = "file-handler",
        url = "${app.services.file}",
        configuration = FeignClientConfig.class
)
public interface FileHandlerRepository {

    @PostMapping(value = "/media/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    Map<String, String> uploadFile(@RequestPart("file") MultipartFile file);
}