package com.devteria.identity.repository.httpclient;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.devteria.identity.configuration.AuthenticationRequestInterceptor;
import com.devteria.identity.dto.request.ApiResponse;
import com.devteria.identity.dto.request.OtpRequest;

@FeignClient(
        name = "course-management",
        url = "${app.services.course}",
        configuration = {AuthenticationRequestInterceptor.class})
public interface SendEmailApi {
    @PostMapping(value = "/api/otp/send", produces = MediaType.APPLICATION_JSON_VALUE)
    ApiResponse<ResponseEntity> sendEmail(@RequestBody OtpRequest request);
}
