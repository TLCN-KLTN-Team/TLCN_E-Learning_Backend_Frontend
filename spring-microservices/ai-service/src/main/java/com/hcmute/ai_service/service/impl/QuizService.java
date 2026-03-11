package com.hcmute.ai_service.service.impl;

import com.hcmute.ai_service.dto.request.GenerateQuizRequest;
import com.hcmute.ai_service.dto.response.AIServiceResponse;
import com.hcmute.ai_service.dto.response.GenerateQuizResponse;
import com.hcmute.ai_service.dto.response.QuizSetResponse;
import com.hcmute.ai_service.exception.AiServiceException;
import com.hcmute.ai_service.exception.AppException;
import com.hcmute.ai_service.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class QuizService {

    private final WebClient quizWebClient;

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

    public List<QuizSetResponse> getListQuizSetByUserId(String userId) {
        return null;
    }
}
