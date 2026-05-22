package com.hcmute.ai_service.service.impl;

import com.hcmute.ai_service.converter.FlashcardConverter;
import com.hcmute.ai_service.dto.request.FlashCardRequest;
import com.hcmute.ai_service.dto.request.SaveFlashcardSetRequest;
import com.hcmute.ai_service.dto.request.UpdateFlashcardSetRequest;
import com.hcmute.ai_service.dto.response.FlashCardResponse;
import com.hcmute.ai_service.dto.response.FlashcardSetResponse;
import com.hcmute.ai_service.exception.AiServiceException;
import com.hcmute.ai_service.exception.AppException;
import com.hcmute.ai_service.exception.ErrorCode;
import com.hcmute.ai_service.model.Flashcard;
import com.hcmute.ai_service.model.FlashcardSet;
import com.hcmute.ai_service.repository.FlashcardSetRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FlashcardService {

    private final FlashcardSetRepository flashcardSetRepository;
    private final FlashcardConverter flashcardConverter;
    private final WebClient flashcardWebClient;

    /**
     * Gọi Python AI service để generate flashcards từ nội dung tài liệu.
     *
     * @param request FlashCardRequest chứa internalDocument, externalDocument và cấu hình số lượng theo độ khó
     * @return FlashCardResponse chứa danh sách flashcards được generate
     */
    public FlashCardResponse generateFlashcards(FlashCardRequest request) {
        log.info("Calling AI service to generate flashcards (internal: {} chars, external: {} chars, configs: {})",
                request.getInternalDocument() != null ? request.getInternalDocument().length() : 0,
                request.getExternalDocument() != null ? request.getExternalDocument().length() : 0,
                request.getCardsPerDifficulty() != null ? request.getCardsPerDifficulty().size() : 0);

        try {
            FlashCardResponse response = flashcardWebClient.post()
                    .uri("/generate")
                    .bodyValue(request)
                    .retrieve()
                    .onStatus(HttpStatusCode::is4xxClientError, resp ->
                            resp.bodyToMono(String.class)
                                    .flatMap(body -> {
                                        log.error("AI flashcard service client error: {}", body);
                                        return Mono.error(new AiServiceException("AI flashcard service error: " + body));
                                    })
                    )
                    .onStatus(HttpStatusCode::is5xxServerError, resp ->
                            resp.bodyToMono(String.class)
                                    .flatMap(body -> {
                                        log.error("AI flashcard service server error: {}", body);
                                        return Mono.error(new AppException(ErrorCode.AI_SERVICE_UNAVAILABLE));
                                    })
                    )
                    .bodyToMono(FlashCardResponse.class)
                    .timeout(Duration.ofSeconds(90))
                    .doOnSuccess(r -> log.info("AI flashcard service returned {} cards",
                            r != null && r.getCards() != null ? r.getCards().size() : 0))
                    .doOnError(error -> log.error("Error generating flashcards: {}", error.getMessage()))
                    .onErrorMap(java.util.concurrent.TimeoutException.class, e ->
                            new AppException(ErrorCode.AI_SERVICE_TIMEOUT)
                    )
                    .onErrorMap(AiServiceException.class, e ->
                            new AppException(ErrorCode.AI_FLASHCARD_GENERATION_FAILED)
                    )
                    .block();

            if (response == null || response.getCards() == null) {
                log.error("AI flashcard service returned null/empty response");
                throw new AppException(ErrorCode.AI_FLASHCARD_GENERATION_FAILED);
            }

            return response;
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error calling AI flashcard service", e);
            throw new AppException(ErrorCode.AI_FLASHCARD_GENERATION_FAILED);
        }
    }

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

        // Nếu client gửi flashcardSetId (content-based hash) và bộ này đã tồn tại
        // thì chặn lưu trùng — UI sẽ thấy lỗi FLASHCARD_EXISTING.
        if (request.getFlashcardSetId() != null && !request.getFlashcardSetId().isBlank()) {
            flashcardSetRepository.findByFlashcardSetId(request.getFlashcardSetId())
                    .ifPresent(existing -> {
                        throw new AppException(ErrorCode.FLASHCARD_EXISTING);
                    });
        }

        List<Flashcard> flashcards = request.getFlashcards().stream()
                .map(flashcardConverter::toEntity)
                .collect(Collectors.toList());

        Instant now = Instant.now();
        FlashcardSet flashcardSet = FlashcardSet.builder()
                .flashcardSetId(request.getFlashcardSetId())
                .flashcardSetName(buildFlashcardSetName(request))
                .flashcards(flashcards)
                .internalDocument(request.getInternalDocument())
                .externalDocument(request.getExternalDocument())
                .authorId(request.getAuthorId())
                .language(request.getLanguage() != null ? request.getLanguage() : "vietnamese")
                .createdAt(now)
                .updatedAt(now)
                .build();

        FlashcardSet savedFlashcardSet = flashcardSetRepository.save(flashcardSet);
        log.info("Saved flashcard set id={}, total cards={}",
                savedFlashcardSet.getId(),
                savedFlashcardSet.getFlashcards() != null ? savedFlashcardSet.getFlashcards().size() : 0);

        return flashcardConverter.toFlashcardSetResponse(savedFlashcardSet);
    }

    /**
     * Tạo tên hiển thị cho bộ flashcard từ vài tag/front đầu tiên để người dùng
     * có thể nhận diện trong kho document-library.
     */
    private String buildFlashcardSetName(SaveFlashcardSetRequest request) {
        if (request.getFlashcards() == null || request.getFlashcards().isEmpty()) {
            return "Bộ Flashcards";
        }
        return request.getFlashcards().stream()
                .map(c -> c.getTags() != null && !c.getTags().isEmpty() ? c.getTags().get(0) : c.getFront())
                .filter(s -> s != null && !s.isBlank())
                .distinct()
                .limit(3)
                .collect(Collectors.joining(", "));
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

    public void deleteFlashcardSet(String id) {
        FlashcardSet flashcardSet = flashcardSetRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.FLASHCARD_NOT_FOUND));
        flashcardSetRepository.delete(flashcardSet);
        log.info("Deleted flashcard set id={}", id);
    }
}
