package com.devteria.identity.repository.httpclient;

import com.devteria.identity.configuration.AuthenticationRequestInterceptor;
import com.devteria.identity.dto.request.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@FeignClient(name = "uploadFileApi", url = "${app.services.file}",
    configuration = {AuthenticationRequestInterceptor.class}
)
public interface UploadImageApi {
    @PostMapping(value = "/media/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    Map<String, String> uploadFile(@RequestPart("file") MultipartFile file);
}
