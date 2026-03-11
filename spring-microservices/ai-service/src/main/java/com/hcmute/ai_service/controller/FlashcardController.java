package com.hcmute.ai_service.controller;

import com.hcmute.ai_service.dto.request.SaveFlashcardSetRequest;
import com.hcmute.ai_service.dto.response.ApiResponse;
import com.hcmute.ai_service.dto.response.FlashcardSetResponse;
import com.hcmute.ai_service.service.impl.FlashcardService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/ai/flashcards")
@RequiredArgsConstructor
@Slf4j
public class FlashcardController {

    private final FlashcardService flashcardService;

    /**
     * API endpoint để lưu một bộ flashcard set vào cơ sở dữ liệu
     * 
     * @param request SaveFlashcardSetRequest chứa danh sách flashcard, tài liệu nguồn và thông tin tác giả
     * @return ApiResponse chứa FlashcardSetResponse đã được lưu
     */
    @PostMapping("/save")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<FlashcardSetResponse> saveFlashcardSet(
            @Valid @RequestBody SaveFlashcardSetRequest request) {
        
        log.info("Received request to save flashcard set with {} flashcards from author: {}", 
                request.getFlashcards() != null ? request.getFlashcards().size() : 0,
                request.getAuthorId());
        
        FlashcardSetResponse savedFlashcardSet = flashcardService.saveFlashcardSet(request);
        
        return ApiResponse.success(
                savedFlashcardSet,
                "Flashcard set saved successfully"
        );
    }

    /**
     * API endpoint để lấy tất cả flashcard set của một tác giả
     * 
     * @param authorId ID của tác giả
     * @return ApiResponse chứa danh sách FlashcardSetResponse
     */
    @GetMapping("/author/{authorId}")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<List<FlashcardSetResponse>> getFlashcardSetsByAuthor(
            @PathVariable String authorId) {
        
        log.info("Received request to get flashcard sets for author: {}", authorId);
        
        List<FlashcardSetResponse> flashcardSets = flashcardService.getListFlashcardSetByAuthor(authorId);
        
        return ApiResponse.success(
                flashcardSets,
                "Flashcard sets retrieved successfully"
        );
    }

    @GetMapping("/{id}")
    public ApiResponse<FlashcardSetResponse> getFlashcardSetsById(@PathVariable String id) {
        FlashcardSetResponse flashcardSetResponse = flashcardService.getFlashcardSetById(id);

        return ApiResponse.success(
                flashcardSetResponse,
                "Flashcard set retrieved successfully"
        );
    }
}

