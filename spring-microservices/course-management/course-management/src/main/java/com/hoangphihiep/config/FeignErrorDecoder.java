package com.hoangphihiep.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import feign.Response;
import feign.codec.ErrorDecoder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.io.InputStream;

@Component
@RequiredArgsConstructor
@Slf4j
public class FeignErrorDecoder implements ErrorDecoder {

    private final ObjectMapper objectMapper;

    @Override
    public Exception decode(String methodKey, Response response) {
        String responseBody = "";

        try (InputStream inputStream = response.body().asInputStream()) {
            responseBody = new String(inputStream.readAllBytes());
            log.error("Feign client error - Method: {}, Status: {}, Body: {}",
                    methodKey, response.status(), responseBody);
        } catch (IOException e) {
            log.error("Failed to read error response body", e);
        }

        switch (response.status()) {
            case 400:
                return new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Bad request to identity service: " + responseBody);
            case 401:
                return new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                        "Authentication failed with identity service");
            case 403:
                return new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Access denied to identity service");
            case 404:
                return new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Resource not found in identity service");
            case 500:
                return new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                        "Identity service internal error: " + responseBody);
            default:
                return new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                        "Unknown error from identity service: " + responseBody);
        }
    }
}
