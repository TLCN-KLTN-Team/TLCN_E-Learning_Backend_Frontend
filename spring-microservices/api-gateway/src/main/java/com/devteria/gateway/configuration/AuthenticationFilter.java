package com.devteria.gateway.configuration;

import com.devteria.gateway.dto.ApiResponse;
import com.devteria.gateway.service.IdentityService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.netty.handler.codec.http.HttpResponseStatus;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import reactor.netty.http.server.HttpServerResponse;

import java.time.Duration;
import java.util.Arrays;
import java.util.List;

@Component
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PACKAGE, makeFinal = true)
@Order(-1)
public class AuthenticationFilter implements GlobalFilter, Ordered {
    IdentityService identityService;
    ObjectMapper objectMapper;

    @NonFinal
    private String[] publicEndpoints = {
            "/identity/auth/.*",
            "/identity/users/registration",
            "/identity/users/registration/send-verification",
            "/identity/users/registration/verify-email",
            "/notification/email/send",
            "/file/media/download/.*",
            "/profile/users/.*",
            "/course-management/educational-unit/register",
            "/course-management/api/otp/send",
            "/identity/forgot-password/.*"
    };

    @Value("${app.api-prefix}")
    @NonFinal
    private String apiPrefix;

    @Override
    public int getOrder() {
        return -1;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        log.info("Enter authentication filter....");

        ServerHttpRequest request = exchange.getRequest();
        log.info("Request URI: " + request.getURI());

        if (isPublicEndpoint(exchange.getRequest())){
            log.info("Processing public endpoint");
            return chain.filter(exchange);
        }

        log.info("Processing HTTP authentication");
        return handleHttpAuthentication(exchange, chain);
    }

    private Mono<Void> handleHttpAuthentication(ServerWebExchange exchange, GatewayFilterChain chain) {
        // Logic authentication cũ cho HTTP requests
        List<String> authHeader = exchange.getRequest().getHeaders().get(HttpHeaders.AUTHORIZATION);
        if (CollectionUtils.isEmpty(authHeader))
            return unauthenticated(exchange.getResponse());

        String token = authHeader.getFirst().replace("Bearer ", "");

        return identityService.introspect(token)
                .timeout(Duration.ofSeconds(5))
                .flatMap(introspectResponse -> {
                    if (introspectResponse.getResult().isValid()) {
                        log.info("HTTP authentication successful. Token: {}", token);
                        return chain.filter(exchange);
                    } else {
                        return unauthenticated(exchange.getResponse());
                    }
                })
                .onErrorResume(throwable -> unauthenticated(exchange.getResponse()));
    }

    private boolean isPublicEndpoint(ServerHttpRequest request){
        return Arrays.stream(publicEndpoints)
                .anyMatch(s -> request.getURI().getPath().matches(apiPrefix + s));
    }

    Mono<Void> unauthenticated(ServerHttpResponse response){
        ApiResponse<?> apiResponse = ApiResponse.builder()
                .code("UNAUTHENTICATED")
                .message("Unauthenticated")
                .build();

        String body = null;
        try {
            body = objectMapper.writeValueAsString(apiResponse);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }

        response.setStatusCode(HttpStatus.UNAUTHORIZED);
        response.getHeaders().add(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE);

        return response.writeWith(
                Mono.just(response.bufferFactory().wrap(body.getBytes())));
    }

    // websocket config
    private Mono<Void> handleWebSocketAuthentication(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();

        // Lấy token từ query parameter cho WebSocket
        String token = request.getQueryParams().getFirst("token");

        if (token == null || token.isEmpty()) {
            log.warn("WebSocket connection attempted without token");
            return unauthenticated(exchange.getResponse());
        }

        return identityService.introspect(token)
                .timeout(Duration.ofSeconds(5))
                .flatMap(introspectResponse -> {
                    if (introspectResponse.getResult().isValid()) {
                        log.info("Request path: {}", request.getURI().getPath());
                        log.info("WebSocket authentication successful. Token: {}", token);
                        return chain.filter(exchange);
                    } else {
                        return unauthenticated(exchange.getResponse());
                    }
                })
                .onErrorResume(throwable -> {
                    log.error("WebSocket authentication error", throwable);
                    return unauthenticated(exchange.getResponse());
                });
    }

    private boolean isWebSocketRequest(ServerHttpRequest request) {
        String upgrade = request.getHeaders().getFirst(HttpHeaders.UPGRADE);
        String connection = request.getHeaders().getFirst(HttpHeaders.CONNECTION);
        return "websocket".equalsIgnoreCase(upgrade) &&
                connection != null && connection.toLowerCase().contains("upgrade");
    }
}
