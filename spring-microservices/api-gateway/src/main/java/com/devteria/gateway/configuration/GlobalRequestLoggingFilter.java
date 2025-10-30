package com.devteria.gateway.configuration;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.logging.Logger;

@Component
@Slf4j
public class GlobalRequestLoggingFilter implements GlobalFilter, Ordered {


    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();

        log.info("=== GLOBAL FILTER ===");
        log.info("Request: {} {}", request.getMethod(), request.getURI());

        return chain.filter(exchange)
                .doOnSuccess(v -> {
                    log.info("Response Status: {}", exchange.getResponse().getStatusCode());
                })
                .doOnError(throwable -> {
                    log.error("Request failed: ", throwable);
                });
    }

    @Override
    public int getOrder() {
        return -2; // Chạy trước authentication filter
    }
}
