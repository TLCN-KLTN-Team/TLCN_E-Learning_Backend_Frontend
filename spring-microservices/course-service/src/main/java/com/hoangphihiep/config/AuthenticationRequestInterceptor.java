package com.hoangphihiep.config;

import com.hoangphihiep.service.JwtService;
import feign.RequestInterceptor;
import feign.RequestTemplate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Slf4j
@Component
@RequiredArgsConstructor
public class AuthenticationRequestInterceptor implements RequestInterceptor {

    private final JwtService jwtService;

    @Override
    public void apply(RequestTemplate template) {
        ServletRequestAttributes attributes =
                (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();

        if (attributes != null && attributes.getRequest() != null) {
            String authHeader = attributes.getRequest().getHeader("Authorization");
            if (StringUtils.hasText(authHeader)) {
                template.header("Authorization", authHeader);
                return;
            }
        }

        try {
            String serviceToken = jwtService.generateServiceToken();
            template.header("Authorization", "Bearer " + serviceToken);
        } catch (Exception e) {
            log.warn("No request context and cannot generate service token for Feign request", e);
        }
    }
}