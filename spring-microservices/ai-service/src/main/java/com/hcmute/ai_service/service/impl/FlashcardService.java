package com.hcmute.ai_service.service.impl;

import com.hcmute.ai_service.converter.FlashcardConverter;
import com.hcmute.ai_service.dto.request.SaveFlashcardSetRequest;
import com.hcmute.ai_service.dto.request.UpdateFlashcardSetRequest;
import com.hcmute.ai_service.dto.response.FlashCardResponse;
import com.hcmute.ai_service.dto.response.FlashcardSetResponse;
import com.hcmute.ai_service.exception.AppException;
import com.hcmute.ai_service.exception.ErrorCode;
import com.hcmute.ai_service.model.Flashcard;
import com.hcmute.ai_service.model.FlashcardSet;
import com.hcmute.ai_service.repository.FlashcardSetRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FlashcardService {

    private final FlashcardSetRepository flashcardSetRepository;
    private final FlashcardConverter flashcardConverter;

    /**
     * Lưu một bộ flashcard set vào cơ sở dữ liệu
     *
     * @param request SaveFlashcardSetRequest chứa thông tin flashcard set
     * @return FlashcardSetResponse chứa thông tin flashcard set đã được lưu
     */
    @Transactional
    public FlashcardSetResponse saveFlashcardSet(SaveFlashcardSetRequest request) {
        log.info("Saving flashcard set with {} flashcards for author: {}", 
                request.getFlashcards().size(), request.getAuthorId());
        
        try {
            // Check if Are saved flashcard set?
            FlashcardSet existingSet = flashcardSetRepository.findByFlashcardSetId(request.getFlashcardSetId())
                    .orElseThrow(() -> new AppException(ErrorCode.FLASHCARD_EXISTING));

            // Convert từ DTO sang Entity
            List<Flashcard> flashcards = request.getFlashcards().stream()
                    .map(flashcardConverter::toEntity)
                    .collect(Collectors.toList());
            
            // Tạo FlashcardSet entity
            FlashcardSet flashcardSet = FlashcardSet.builder()
                    .flashcards(flashcards)
                    .internalDocument(request.getInternalDocument())
                    .externalDocument(request.getExternalDocument())
                    .authorId(request.getAuthorId())
                    .language(request.getLanguage() != null ? request.getLanguage() : "vietnamese")
                    .createdAt(Instant.now())
                    .updatedAt(Instant.now())
                    .build();
            
            // Lưu vào database
            FlashcardSet savedFlashcardSet = flashcardSetRepository.save(flashcardSet);
            
            log.info("Successfully saved flashcard set with ID: {}", savedFlashcardSet.getId());
            
            // Convert từ Entity sang DTO để trả về
            return flashcardConverter.toFlashcardSetResponse(savedFlashcardSet);
                    
        } catch (Exception e) {
            log.error("Error saving flashcard set: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to save flashcard set", e);
        }
    }

    public FlashcardSetResponse updateFlashcardSet(UpdateFlashcardSetRequest request) {
        log.info("Updating flashcard set with ID: {}", request.getFlashcardSetId());

        FlashcardSet existingSet = flashcardSetRepository.findByFlashcardSetId(request.getFlashcardSetId())
                .orElseThrow(() -> new AppException(ErrorCode.FLASHCARD_NOT_FOUND));

        List<Flashcard> flashcards = request.getFlashcards().stream()
                .map(flashcardConverter::toEntity)
                .collect(Collectors.toList());

        existingSet.setFlashcards(flashcards);
        existingSet.setInternalDocument(request.getInternalDocument());
        existingSet.setExternalDocument(request.getExternalDocument());
        existingSet.setLanguage(existingSet.getLanguage());
        existingSet.setCreatedAt(existingSet.getCreatedAt());
        existingSet.setUpdatedAt(Instant.now());

        FlashcardSet updatedFlashcardSet = flashcardSetRepository.save(existingSet);

        return flashcardConverter.toFlashcardSetResponse(updatedFlashcardSet);
    }

    /**
     * Lấy tất cả flashcard set của một tác giả
     *
     * @param authorId ID của tác giả
     * @return Danh sách FlashcardSetResponse
     */
    public List<FlashcardSetResponse> getListFlashcardSetByAuthor(String authorId) {
        log.info("Getting flashcard sets for author: {}", authorId);
        
        List<FlashcardSet> flashcardSets = flashcardSetRepository.findByAuthorId(authorId);
        
        return flashcardSets.stream()
                .map(flashcardConverter::toFlashcardSetResponse)
                .collect(Collectors.toList());
    }

    public FlashcardSetResponse getFlashcardSetById(String id) {

        FlashcardSet flashcardSet = flashcardSetRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.FLASHCARD_NOT_FOUND));

        return flashcardConverter.toFlashcardSetResponse(flashcardSet);
    }
}
