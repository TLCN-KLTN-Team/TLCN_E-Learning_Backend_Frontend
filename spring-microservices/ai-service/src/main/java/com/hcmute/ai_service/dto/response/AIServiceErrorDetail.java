package com.hcmute.ai_service.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Error detail từ Python AI Service
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AIServiceErrorDetail {
    private String code;
    private String message;
    
    @JsonProperty("partial_results")
    private Map<String, Object> partialResults;
}
