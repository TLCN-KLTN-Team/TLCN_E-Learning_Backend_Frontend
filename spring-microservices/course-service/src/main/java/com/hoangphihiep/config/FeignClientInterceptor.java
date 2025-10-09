package com.hoangphihiep.config;

import com.hoangphihiep.service.JwtService;
import feign.RequestInterceptor;
import feign.RequestTemplate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class FeignClientInterceptor implements RequestInterceptor {

    private final JwtService jwtService;

    @Override
    public void apply(RequestTemplate template) {
        try {
            String serviceToken = jwtService.generateServiceToken();
            template.header("Authorization", "Bearer " + serviceToken);
            log.debug("Added service token to Feign request: {}", template.url());
        } catch (Exception e) {
            log.error("Failed to add service token to Feign request", e);
        }
    }
}
