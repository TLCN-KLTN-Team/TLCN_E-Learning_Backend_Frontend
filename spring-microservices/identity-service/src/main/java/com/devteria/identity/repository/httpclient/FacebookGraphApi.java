package com.devteria.identity.repository.httpclient;

import com.devteria.identity.dto.request.ExchangeTokenRequest;
import com.devteria.identity.dto.response.ExchangeTokenResponse;
import com.devteria.identity.dto.response.FacebookUserInfoResponse;
import feign.QueryMap;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "facebook-graph-api", url = "https://graph.facebook.com")
public interface FacebookGraphApi {
    @PostMapping(value = "/v20.0/oauth/access_token", produces = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    ExchangeTokenResponse exchangeToken(@QueryMap ExchangeTokenRequest request);

    @PostMapping(value = "/me", produces = MediaType.APPLICATION_JSON_VALUE)
    FacebookUserInfoResponse getFacebookUserInfo(@RequestParam("accessToken") String accessToken,
                                                 @RequestParam("fields") String fields);
}
