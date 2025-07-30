package com.devteria.identity.repository.httpclient;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.devteria.identity.dto.response.GoogleUserInfoResponse;

@FeignClient(name = "get-info-user-service", url = "https://www.googleapis.com")
public interface OutboundUserInfoClient {
    @GetMapping(value = "/oauth2/v1/userinfo")
    GoogleUserInfoResponse getUserInfo(
            @RequestParam("alt") String alt, @RequestParam("access_token") String accessToken);
}
