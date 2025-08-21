package com.hoangphihiep.config;

import feign.Logger;
import feign.RequestInterceptor;
import feign.codec.ErrorDecoder;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@RequiredArgsConstructor
public class FeignClientConfig {

    private final FeignClientInterceptor feignClientInterceptor;
    private final FeignErrorDecoder feignErrorDecoder;

    @Bean
    public RequestInterceptor requestInterceptor() {
        return feignClientInterceptor;
    }

    @Bean
    public ErrorDecoder errorDecoder() {
        return feignErrorDecoder;
    }

    @Bean
    public Logger.Level feignLoggerLevel() {
        return Logger.Level.FULL; // Change to FULL for debugging
    }
}
