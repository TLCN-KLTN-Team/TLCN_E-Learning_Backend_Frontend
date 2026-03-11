package com.hcmute.ai_service.controller;

import com.hcmute.ai_service.dto.request.GenerateQuizRequest;
import com.hcmute.ai_service.dto.response.ApiResponse;
import com.hcmute.ai_service.dto.response.GenerateQuizResponse;
import com.hcmute.ai_service.service.impl.QuizService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/ai/quiz")
@RequiredArgsConstructor
@Slf4j
public class QuizController {

    private final QuizService quizService;

    /**
     * API endpoint để generate quiz từ context sử dụng AI
     * 
     * @param request GenerateQuizRequest chứa context và cấu hình câu hỏi
     * @return ApiResponse chứa GenerateQuizResponse với danh sách câu hỏi
     */
    @PostMapping("/generate")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<GenerateQuizResponse> generateQuizFromContext(
            @Valid @RequestBody GenerateQuizRequest request) {
        
        log.info("Received request to generate quiz");
        
        GenerateQuizResponse response = quizService.generateQuiz(request);
        
        return ApiResponse.success(
                response,
                "Quiz generated successfully"
        );
    }


    @GetMapping("/user/{userId}")
    public ApiResponse<?> getListQuizSetByUserId(@PathVariable String userId) {

        return null;
    }
}
