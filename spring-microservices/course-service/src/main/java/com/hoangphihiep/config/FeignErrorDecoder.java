package com.hoangphihiep.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hoangphihiep.exception.AppException;
import com.hoangphihiep.exception.ErrorCode;
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

            // Parse JSON body để lấy code
            var jsonNode = objectMapper.readTree(responseBody);
            String code = jsonNode.has("code") ? jsonNode.get("code").asText() : null;
            String message = jsonNode.has("message") ? jsonNode.get("message").asText() : "Unknown error";

            if ("USER_2003".equals(code)) {
                return new AppException(ErrorCode.EMAIL_EXISTED);
            }
            if ("USER_2001".equals(code)) {
                return new AppException(ErrorCode.USERNAME_EXISTED);
            }
            if ("TEACHER_6003".equals(code)) {
                return new AppException(ErrorCode.INSTRUCTOR_CODE_EXISTED);
            }
            if ("STUDENT_6001".equals(code)) {
                return new AppException(ErrorCode.STUDENT_CODE_EXISTED);
            }

            return new ResponseStatusException(HttpStatus.valueOf(response.status()),
                    "Bad request to identity service: " + message);

        } catch (IOException e) {
            log.error("Failed to read error response body", e);
            return new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Failed to decode error response", e);
        }
    }
}
