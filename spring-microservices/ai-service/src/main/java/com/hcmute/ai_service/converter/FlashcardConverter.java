package com.hcmute.ai_service.converter;

import com.hcmute.ai_service.dto.response.FlashcardDto;
import com.hcmute.ai_service.dto.response.FlashcardSetResponse;
import com.hcmute.ai_service.model.Flashcard;
import com.hcmute.ai_service.model.FlashcardSet;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class FlashcardConverter {

    /**
     * Convert từ FlashcardDto sang Flashcard Entity
     *
     * @param dto FlashcardDto từ request
     * @return Flashcard entity
     */
    public Flashcard toEntity(FlashcardDto dto) {
        return Flashcard.builder()
                .front(dto.getFront())
                .back(dto.getBack())
                .tags(dto.getTags())
                .difficulty(dto.getDifficulty())
                .build();
    }

    /**
     * Convert từ Flashcard Entity sang FlashcardDto
     *
     * @param flashcard Flashcard entity
     * @return FlashcardDto
     */
    public FlashcardDto toDto(Flashcard flashcard) {
        return FlashcardDto.builder()
                .front(flashcard.getFront())
                .back(flashcard.getBack())
                .tags(flashcard.getTags())
                .difficulty(flashcard.getDifficulty())
                .build();
    }

    /**
     * Convert từ FlashcardSet Entity sang FlashcardSetResponse
     *
     * @param flashcardSet FlashcardSet entity
     * @return FlashcardSetResponse
     */
    public FlashcardSetResponse toFlashcardSetResponse(FlashcardSet flashcardSet) {
        List<FlashcardDto> flashcardDtos = flashcardSet.getFlashcards() != null
                ? flashcardSet.getFlashcards().stream()
                        .map(this::toDto)
                        .collect(Collectors.toList())
                : List.of();

        return FlashcardSetResponse.builder()
                .id(flashcardSet.getId())
                .name(flashcardSet.getFlashcardSetName())
                .flashcards(flashcardDtos)
                .internalDocument(flashcardSet.getInternalDocument())
                .externalDocument(flashcardSet.getExternalDocument())
                .authorId(flashcardSet.getAuthorId())
                .language(flashcardSet.getLanguage())
                .createdAt(flashcardSet.getCreatedAt())
                .updatedAt(flashcardSet.getUpdatedAt())
                .number(flashcardDtos.size())
                .build();
    }
}
