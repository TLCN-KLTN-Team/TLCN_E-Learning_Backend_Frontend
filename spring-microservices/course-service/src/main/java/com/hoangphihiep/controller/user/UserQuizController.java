package com.hoangphihiep.controller.user;

import com.hoangphihiep.dto.request.QuizAttemptRequest;
import com.hoangphihiep.dto.response.*;
import com.hoangphihiep.service.UserQuizService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/user/quizzes")
@RequiredArgsConstructor
public class UserQuizController {

    private final UserQuizService userQuizService;

    @GetMapping("/{quizId}")
    public ApiResponse<QuizResponse> getQuizDetail(@PathVariable Integer quizId) {
        return ApiResponse.<QuizResponse>builder()
                .result(userQuizService.getQuizDetail(quizId))
                .build();
    }

    @GetMapping("/{quizId}/attempts")
    public ApiResponse<List<QuizAttemptHistoryResponse>> getQuizAttemptHistory(
            @PathVariable Integer quizId) {
        return ApiResponse.<List<QuizAttemptHistoryResponse>>builder()
                .result(userQuizService.getQuizAttemptHistory(quizId))
                .build();
    }

    @PostMapping("/{quizId}/start")
    public ApiResponse<Map<String, Integer>> startQuizAttempt(@PathVariable Integer quizId) {
        return ApiResponse.<Map<String, Integer>>builder()
                .result(userQuizService.startQuizAttempt(quizId))
                .build();
    }

    @PostMapping("/{quizId}/submit")
    public ApiResponse<QuizAttemptResponse> submitQuizAttempt(
            @PathVariable Integer quizId,
            @RequestBody QuizAttemptRequest request) {

        return ApiResponse.<QuizAttemptResponse>builder()
                .result(userQuizService.submitQuizAttempt(quizId, request))
                .build();
    }

    @GetMapping("/attempts/{attemptId}")
    public ApiResponse<QuizAttemptResponse> getAttemptResult(@PathVariable Integer attemptId) {
        return ApiResponse.<QuizAttemptResponse>builder()
                .result(userQuizService.getAttemptResult(attemptId))
                .build();
    }
}
