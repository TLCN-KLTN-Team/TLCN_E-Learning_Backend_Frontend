package com.hoangphihiep.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.validator.internal.util.logging.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.logging.Logger;

@Component
@Slf4j
public class RequestLoggingFilter extends OncePerRequestFilter {

    private static final String[] PUBLIC_ENDPOINTS = {
            "/server/ws/info",
            "/server/ws/**",
            "/ws/**",
            "/ws/info",
            "/educational-unit/register"
    };

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // Bỏ qua logging cho multipart requests
        String contentType = request.getContentType();
        if (contentType != null && contentType.startsWith("multipart/form-data")) {
            log.info("Request: {} {} | Content-Type: multipart/form-data (body not logged)",
                    request.getMethod(), request.getRequestURI());
            filterChain.doFilter(request, response);
            return;
        }

        log.info("Request: {} {} | Headers: {}",
                request.getMethod(), request.getRequestURI(), request.getHeader("Authorization"));
        log.info("Query Params: {}", request.getQueryString());
        filterChain.doFilter(request, response);
    }

    private boolean byPassFilter(HttpServletRequest request) {
        String requestURI = request.getRequestURI();
        for (String endpoint : PUBLIC_ENDPOINTS) {
            if (requestURI.startsWith(endpoint)) {
                return true;
            }
        }
        return false;
    }
}
