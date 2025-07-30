package com.devteria.identity.repository.httpclient;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;

import com.devteria.identity.dto.request.ExchangeTokenRequest;
import com.devteria.identity.dto.response.ExchangeTokenResponse;

import feign.QueryMap;

@FeignClient(name = "outbound-authentication", url = "https://oauth2.googleapis.com")
public interface OutboundAuthenticationClient {
    @PostMapping(value = "/token", produces = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    ExchangeTokenResponse exchangeAccessToken(@QueryMap ExchangeTokenRequest request);
}
