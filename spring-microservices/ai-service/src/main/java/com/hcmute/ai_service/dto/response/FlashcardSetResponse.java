package com.hcmute.ai_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FlashcardSetResponse {
    
    private String id;
    private List<FlashcardDto> flashcards;
    private String internalDocument;
    private String externalDocument;
    private String authorId;
    private String language;
    private Instant createdAt;
    private Instant updatedAt;
}
