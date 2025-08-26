package com.devteria.identity.dto.response;

import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class ErrorResponse {
    String message;
    String code;
    int status;
    long timestamp; // using to retry call apis
    Map<String, String> errors; // using to validation errors

    public ErrorResponse(String message, String code, int status, long timestamp) {
        this.message = message;
        this.code = code;
        this.status = status;
        this.timestamp = timestamp;
    }
}
