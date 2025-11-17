package com.hoangphihiep.controller.student;

import com.hoangphihiep.dto.request.QuizAttemptRequest;
import com.hoangphihiep.dto.response.*;
import com.hoangphihiep.service.StudentQuizService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/student/quizzes")
@RequiredArgsConstructor
public class StudentQuizController {

    private final StudentQuizService studentQuizService;

    @GetMapping("/{quizId}")
    public ApiResponse<QuizResponse> getQuizDetail(@PathVariable Integer quizId) {
        return ApiResponse.<QuizResponse>builder()
                .result(studentQuizService.getQuizDetail(quizId))
                .build();
    }

    @GetMapping("/{quizId}/attempts")
    public ApiResponse<List<QuizAttemptHistoryResponse>> getQuizAttemptHistory(
            @PathVariable Integer quizId) {
        return ApiResponse.<List<QuizAttemptHistoryResponse>>builder()
                .result(studentQuizService.getQuizAttemptHistory(quizId))
                .build();
    }

    @PostMapping("/{quizId}/start")
    public ApiResponse<Map<String, Integer>> startQuizAttempt(@PathVariable Integer quizId) {
        return ApiResponse.<Map<String, Integer>>builder()
                .result(studentQuizService.startQuizAttempt(quizId))
                .build();
    }

    @PostMapping("/{quizId}/submit")
    public ApiResponse<QuizAttemptResponse> submitQuizAttempt(
            @PathVariable Integer quizId,
            @RequestBody QuizAttemptRequest request) {

        return ApiResponse.<QuizAttemptResponse>builder()
                .result(studentQuizService.submitQuizAttempt(quizId, request))
                .build();
    }

    @GetMapping("/attempts/{attemptId}")
    public ApiResponse<QuizAttemptResponse> getAttemptResult(@PathVariable Integer attemptId) {
        return ApiResponse.<QuizAttemptResponse>builder()
                .result(studentQuizService.getAttemptResult(attemptId))
                .build();
    }
}
