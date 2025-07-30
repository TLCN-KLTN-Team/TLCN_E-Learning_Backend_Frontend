package com.devteria.profile.repository.httpclient;

import org.springframework.cloud.openfeign.FeignClient;

@FeignClient(name = "get-profile", url = "http://localhost:8083")
public interface ProfileClient {
}
