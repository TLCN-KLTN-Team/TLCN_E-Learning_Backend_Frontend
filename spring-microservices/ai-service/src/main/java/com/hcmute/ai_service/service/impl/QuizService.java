package com.hcmute.ai_service.service.impl;

import com.hcmute.ai_service.dto.request.GenerateQuizRequest;
import com.hcmute.ai_service.dto.request.SaveQuizSetRequest;
import com.hcmute.ai_service.dto.response.AIServiceResponse;
import com.hcmute.ai_service.dto.response.GenerateQuizResponse;
import com.hcmute.ai_service.dto.response.QuizSetResponse;
import com.hcmute.ai_service.exception.AiServiceException;
import com.hcmute.ai_service.exception.AppException;
import com.hcmute.ai_service.exception.ErrorCode;
import com.hcmute.ai_service.model.QuizSet;
import com.hcmute.ai_service.repository.QuizSetRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
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
public class QuizService {

    private final WebClient quizWebClient;
    private final QuizSetRepository quizSetRepository;

    /**
     * Gọi Python AI service để generate quiz từ context
     *
     * @param request GenerateQuizRequest chứa context và cấu hình câu hỏi
     * @return GenerateQuizResponse chứa danh sách câu hỏi được generate
     * @throws AppException khi có lỗi xảy ra
     */
    public GenerateQuizResponse generateQuiz(GenerateQuizRequest request) {
        log.info("Calling AI service to generate quiz with context length: {}", 
                request.getContext() != null ? request.getContext().length() : 0);
        
        try {
            AIServiceResponse<GenerateQuizResponse> aiQuizResponse = quizWebClient.post()
                    .uri("/generate")
                    .bodyValue(request)
                    .retrieve()
                    .onStatus(HttpStatusCode::is4xxClientError, response ->
                            response.bodyToMono(String.class)
                                    .flatMap(body -> {
                                        log.error("AI service client error: {}", body);
                                        return Mono.error(new AiServiceException("AI service error: " + body));
                                    })
                    )
                    .onStatus(HttpStatusCode::is5xxServerError, response ->
                            response.bodyToMono(String.class)
                                    .flatMap(body -> {
                                        log.error("AI service server error: {}", body);
                                        return Mono.error(new AppException(ErrorCode.AI_SERVICE_UNAVAILABLE));
                                    })
                    )
                    .bodyToMono(new ParameterizedTypeReference<AIServiceResponse<GenerateQuizResponse>>() {})
                    .timeout(Duration.ofSeconds(60))
                    .doOnSuccess(response -> 
                            log.info("AI service response received, success: {}", 
                                    response != null ? response.getSuccess() : null)
                    )
                    .doOnError(error -> 
                            log.error("Error generating quiz: {}", error.getMessage())
                    )
                    .onErrorMap(java.util.concurrent.TimeoutException.class, e -> 
                            new AppException(ErrorCode.AI_SERVICE_TIMEOUT)
                    )
                    .onErrorMap(AiServiceException.class, e ->
                            new AppException(ErrorCode.AI_QUIZ_GENERATION_FAILED)
                    )
                    .block();
            
            // Unwrap AI Service response
            if (aiQuizResponse == null) {
                log.error("Received null response from AI service");
                throw new AppException(ErrorCode.AI_QUIZ_GENERATION_FAILED);
            }
            
            if (!Boolean.TRUE.equals(aiQuizResponse.getSuccess())) {
                log.error("AI service returned error: {}",
                        aiQuizResponse.getError() != null ? aiQuizResponse.getError().getMessage() : "Unknown error");
                throw new AppException(ErrorCode.AI_QUIZ_GENERATION_FAILED);
            }
            
            GenerateQuizResponse quizResponse = aiQuizResponse.getData();
            if (quizResponse == null) {
                log.error("AI service returned null data");
                throw new AppException(ErrorCode.AI_QUIZ_GENERATION_FAILED);
            }
            
            log.info("Successfully generated {} questions", 
                    quizResponse.getQuestions() != null ? quizResponse.getQuestions().size() : 0);
            
            return quizResponse;
                    
        } catch (Exception e) {
            log.error("Unexpected error calling AI service", e);
            throw new AppException(ErrorCode.AI_QUIZ_GENERATION_FAILED);
        }
    }

    /**
     * Generate quiz cho luồng học viên (Bước 1 -> CĐR, Bước 2 -> loại,
     * Bước 3 -> số lượng theo độ khó). Proxy sang Python endpoint /user/generate
     * — endpoint này nhận thêm `learning_outcomes` và gắn nguồn CĐR vào mỗi
     * câu hỏi response.
     */
    public GenerateQuizResponse generateQuizForUser(GenerateQuizRequest request) {
        log.info("Calling AI service /user/generate (outcomes: {}, context length: {})",
                request.getLearningOutcomes() != null ? request.getLearningOutcomes().size() : 0,
                request.getContext() != null ? request.getContext().length() : 0);

        try {
            AIServiceResponse<GenerateQuizResponse> aiQuizResponse = quizWebClient.post()
                    .uri("/user/generate")
                    .bodyValue(request)
                    .retrieve()
                    .onStatus(HttpStatusCode::is4xxClientError, response ->
                            response.bodyToMono(String.class)
                                    .flatMap(body -> {
                                        log.error("AI service client error: {}", body);
                                        return Mono.error(new AiServiceException("AI service error: " + body));
                                    })
                    )
                    .onStatus(HttpStatusCode::is5xxServerError, response ->
                            response.bodyToMono(String.class)
                                    .flatMap(body -> {
                                        log.error("AI service server error: {}", body);
                                        return Mono.error(new AppException(ErrorCode.AI_SERVICE_UNAVAILABLE));
                                    })
                    )
                    .bodyToMono(new ParameterizedTypeReference<AIServiceResponse<GenerateQuizResponse>>() {})
                    .timeout(Duration.ofSeconds(90))
                    .doOnSuccess(response ->
                            log.info("AI /user/generate response received, success: {}",
                                    response != null ? response.getSuccess() : null)
                    )
                    .doOnError(error ->
                            log.error("Error generating quiz (user flow): {}", error.getMessage())
                    )
                    .onErrorMap(java.util.concurrent.TimeoutException.class, e ->
                            new AppException(ErrorCode.AI_SERVICE_TIMEOUT)
                    )
                    .onErrorMap(AiServiceException.class, e ->
                            new AppException(ErrorCode.AI_QUIZ_GENERATION_FAILED)
                    )
                    .block();

            if (aiQuizResponse == null) {
                log.error("Received null response from AI service /user/generate");
                throw new AppException(ErrorCode.AI_QUIZ_GENERATION_FAILED);
            }

            if (!Boolean.TRUE.equals(aiQuizResponse.getSuccess())) {
                log.error("AI /user/generate returned error: {}",
                        aiQuizResponse.getError() != null ? aiQuizResponse.getError().getMessage() : "Unknown error");
                throw new AppException(ErrorCode.AI_QUIZ_GENERATION_FAILED);
            }

            GenerateQuizResponse quizResponse = aiQuizResponse.getData();
            if (quizResponse == null) {
                log.error("AI /user/generate returned null data");
                throw new AppException(ErrorCode.AI_QUIZ_GENERATION_FAILED);
            }

            log.info("Successfully generated {} questions (user flow)",
                    quizResponse.getQuestions() != null ? quizResponse.getQuestions().size() : 0);

            return quizResponse;

        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error calling AI service /user/generate", e);
            throw new AppException(ErrorCode.AI_QUIZ_GENERATION_FAILED);
        }
    }

    /**
     * Lưu một bộ quiz đã được người dùng "Lưu vào kho" sau phase tạo của
     * AIQuizPractice. quizSetId là content-based hash từ FE, dùng để chặn lưu
     * trùng cùng một bộ.
     */
    @Transactional
    public QuizSetResponse saveQuizSet(SaveQuizSetRequest request) {
        log.info("Saving quiz set with {} questions for author: {}",
                request.getQuestions() != null ? request.getQuestions().size() : 0,
                request.getAuthorId());

        if (request.getQuizSetId() != null && !request.getQuizSetId().isBlank()) {
            quizSetRepository.findByQuizSetId(request.getQuizSetId())
                    .ifPresent(existing -> {
                        throw new AppException(ErrorCode.QUIZ_SET_EXISTING);
                    });
        }

        Instant now = Instant.now();
        QuizSet quizSet = QuizSet.builder()
                .quizSetId(request.getQuizSetId())
                .quizSetName(request.getQuizSetName() != null && !request.getQuizSetName().isBlank()
                        ? request.getQuizSetName()
                        : "Bộ Quiz")
                .questions(request.getQuestions())
                .context(request.getContext())
                .externalDocument(request.getExternalDocument())
                .authorId(request.getAuthorId())
                .language(request.getLanguage() != null ? request.getLanguage() : "vietnamese")
                .createdAt(now)
                .updatedAt(now)
                .build();

        QuizSet saved = quizSetRepository.save(quizSet);
        log.info("Saved quiz set id={}, total questions={}",
                saved.getId(),
                saved.getQuestions() != null ? saved.getQuestions().size() : 0);

        return toResponse(saved);
    }

    public List<QuizSetResponse> getListQuizSetByUserId(String userId) {
        log.info("Getting quiz sets for author: {}", userId);
        return quizSetRepository.findByAuthorId(userId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public QuizSetResponse getQuizSetById(String id) {
        QuizSet quizSet = quizSetRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.QUIZ_SET_NOT_FOUND));
        return toResponse(quizSet);
    }

    public void deleteQuizSet(String id) {
        QuizSet quizSet = quizSetRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.QUIZ_SET_NOT_FOUND));
        quizSetRepository.delete(quizSet);
        log.info("Deleted quiz set id={}", id);
    }

    private QuizSetResponse toResponse(QuizSet quizSet) {
        return QuizSetResponse.builder()
                .id(quizSet.getId())
                .name(quizSet.getQuizSetName())
                .questions(quizSet.getQuestions())
                .context(quizSet.getContext())
                .externalDocument(quizSet.getExternalDocument())
                .authorId(quizSet.getAuthorId())
                .language(quizSet.getLanguage())
                .createdAt(quizSet.getCreatedAt())
                .updatedAt(quizSet.getUpdatedAt())
                .number(quizSet.getQuestions() != null ? quizSet.getQuestions().size() : 0)
                .build();
    }
}
