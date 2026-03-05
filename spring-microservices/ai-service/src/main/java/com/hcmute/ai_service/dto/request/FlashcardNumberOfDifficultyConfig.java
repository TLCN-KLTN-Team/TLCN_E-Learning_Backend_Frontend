package com.hcmute.ai_service.dto.request;

import com.hcmute.ai_service.model.DifficultyLevel;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FlashcardNumberOfDifficultyConfig {
    
    @NotNull(message = "Độ khó không được null")
    private DifficultyLevel difficulty;
    
    @Min(value = 1, message = "Số lượng thẻ phải ít nhất là 1")
    private int numberOfCards;
}
