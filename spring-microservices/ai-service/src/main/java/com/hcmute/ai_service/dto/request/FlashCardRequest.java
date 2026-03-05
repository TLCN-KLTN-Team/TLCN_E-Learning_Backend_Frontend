package com.hcmute.ai_service.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FlashCardRequest {
    
    @NotBlank(message = "Tài liệu nội bộ không được để trống")
    private String internalDocument;
    
    private String externalDocument;
    
    @NotEmpty(message = "Cấu hình số lượng thẻ không được để trống")
    @Valid
    private List<FlashcardNumberOfDifficultyConfig> cardsPerDifficulty;
    
    @Builder.Default
    private String language = "vietnamese";
}
