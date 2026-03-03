package com.hcmute.ai_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response wrapper từ Python AI Service
 * Maps với ApiResponse[T] trong Python
 * 
 * @param <T> Type của data được trả về
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AIServiceResponse<T> {
    private Boolean success;
    private T data;
    private AIServiceErrorDetail error;
}
