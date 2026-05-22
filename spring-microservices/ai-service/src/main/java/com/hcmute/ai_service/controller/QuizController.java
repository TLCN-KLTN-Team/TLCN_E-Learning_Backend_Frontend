package com.hcmute.ai_service.controller;

import com.hcmute.ai_service.dto.request.GenerateQuizRequest;
import com.hcmute.ai_service.dto.request.SaveQuizSetRequest;
import com.hcmute.ai_service.dto.response.ApiResponse;
import com.hcmute.ai_service.dto.response.GenerateQuizResponse;
import com.hcmute.ai_service.dto.response.QuizSetResponse;
import com.hcmute.ai_service.service.impl.QuizService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/ai/quiz")
@RequiredArgsConstructor
@Slf4j
public class QuizController {

    private final QuizService quizService;

    /**
     * Generate quiz từ context sử dụng AI (luồng admin/giảng viên).
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

    /**
     * Generate quiz từ context sử dụng AI (luồng học viên — nhận
     * learning_outcomes ở Bước 1).
     */
    @PostMapping("/user/generate")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<GenerateQuizResponse> generateQuizFromContextForUser(
            @Valid @RequestBody GenerateQuizRequest request) {

        log.info("Received request to generate quiz for user flow (outcomes: {})",
                request.getLearningOutcomes() != null ? request.getLearningOutcomes().size() : 0);

        GenerateQuizResponse response = quizService.generateQuizForUser(request);

        return ApiResponse.success(
                response,
                "Quiz generated successfully"
        );
    }

    /**
     * Lưu một bộ quiz vào kho tài liệu của người dùng (sau phase tạo ở
     * AIQuizPractice).
     */
    @PostMapping("/save")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<QuizSetResponse> saveQuizSet(
            @Valid @RequestBody SaveQuizSetRequest request) {

        log.info("Received request to save quiz set with {} questions from author: {}",
                request.getQuestions() != null ? request.getQuestions().size() : 0,
                request.getAuthorId());

        QuizSetResponse saved = quizService.saveQuizSet(request);

        return ApiResponse.success(
                saved,
                "Quiz set saved successfully"
        );
    }

    /**
     * Lấy tất cả quiz set của một người dùng (phục vụ trang document-library).
     */
    @GetMapping("/user/{userId}")
    public ApiResponse<List<QuizSetResponse>> getListQuizSetByUserId(@PathVariable String userId) {
        log.info("Received request to get quiz sets for user: {}", userId);

        List<QuizSetResponse> quizSets = quizService.getListQuizSetByUserId(userId);

        return ApiResponse.success(
                quizSets,
                "Quiz sets retrieved successfully"
        );
    }

    @GetMapping("/{id}")
    public ApiResponse<QuizSetResponse> getQuizSetById(@PathVariable String id) {
        QuizSetResponse quizSet = quizService.getQuizSetById(id);

        return ApiResponse.success(
                quizSet,
                "Quiz set retrieved successfully"
        );
    }

    /**
     * Xóa một bộ quiz khỏi kho tài liệu.
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<Void> deleteQuizSet(@PathVariable String id) {
        log.info("Received request to delete quiz set: {}", id);
        quizService.deleteQuizSet(id);
        return ApiResponse.success(null, "Quiz set deleted successfully");
    }
}
