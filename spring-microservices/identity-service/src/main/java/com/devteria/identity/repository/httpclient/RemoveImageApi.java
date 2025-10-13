package com.devteria.identity.repository.httpclient;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;

import com.devteria.identity.configuration.AuthenticationRequestInterceptor;

@FeignClient(
        name = "removeFileApi",
        url = "${app.services.file}",
        configuration = {AuthenticationRequestInterceptor.class})
public interface RemoveImageApi {
    @PostMapping("/media/remove-image/{publicId}")
    void removeFile(@PathVariable String publicId);
}
