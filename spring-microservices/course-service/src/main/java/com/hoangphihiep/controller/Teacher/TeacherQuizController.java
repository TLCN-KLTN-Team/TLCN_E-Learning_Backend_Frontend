package com.hoangphihiep.controller.Teacher;

import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.QuizResultResponse;
import com.hoangphihiep.service.TeacherQuizService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/teacher/quizzes")
@RequiredArgsConstructor
@Slf4j
public class TeacherQuizController {

    private final TeacherQuizService teacherQuizService;

    /**
     * Get all quiz results for a class
     * GET /api/teacher/quizzes/class/{classId}/results
     */
    @GetMapping("/class/{classId}/results")
    public ApiResponse<List<QuizResultResponse>> getQuizResultsForClass(
            @PathVariable Integer classId) {

        log.info("GET quiz results for class: {}", classId);

        List<QuizResultResponse> results =
                teacherQuizService.getQuizResultsForClass(classId);

        return ApiResponse.<List<QuizResultResponse>>builder()
                .result(results)
                .build();
    }

    /**
     * Get results for a specific quiz
     * GET /api/teacher/quizzes/{quizId}/class/{classId}/results
     */
    @GetMapping("/{quizId}/class/{classId}/results")
    public ApiResponse<List<QuizResultResponse>> getResultsByQuiz(
            @PathVariable Integer quizId,
            @PathVariable Integer classId) {

        log.info("GET results for quiz {} in class {}", quizId, classId);

        List<QuizResultResponse> results =
                teacherQuizService.getResultsByQuiz(quizId, classId);

        return ApiResponse.<List<QuizResultResponse>>builder()
                .result(results)
                .build();
    }

    /**
     * Get quiz statistics for a class
     * GET /api/teacher/quizzes/class/{classId}/statistics
     */
    @GetMapping("/class/{classId}/statistics")
    public ApiResponse<Map<String, Object>> getQuizStatistics(
            @PathVariable Integer classId) {

        log.info("GET quiz statistics for class: {}", classId);

        Map<String, Object> statistics =
                teacherQuizService.getQuizStatistics(classId);

        return ApiResponse.<Map<String, Object>>builder()
                .result(statistics)
                .build();
    }

    /**
     * Get detailed result for a specific attempt
     * GET /api/teacher/quizzes/attempts/{attemptId}
     */
    @GetMapping("/attempts/{attemptId}")
    public ApiResponse<QuizResultResponse> getAttemptDetail(
            @PathVariable Integer attemptId) {

        log.info("GET attempt detail: {}", attemptId);

        QuizResultResponse result =
                teacherQuizService.getAttemptDetail(attemptId);

        return ApiResponse.<QuizResultResponse>builder()
                .result(result)
                .build();
    }
}