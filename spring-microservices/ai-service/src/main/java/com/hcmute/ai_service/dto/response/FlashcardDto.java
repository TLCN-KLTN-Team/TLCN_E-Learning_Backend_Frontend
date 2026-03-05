package com.hcmute.ai_service.dto.response;

import com.hcmute.ai_service.model.DifficultyLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FlashcardDto {
    private String front;
    private String back;
    private List<String> tags;
    private DifficultyLevel difficulty;
}
