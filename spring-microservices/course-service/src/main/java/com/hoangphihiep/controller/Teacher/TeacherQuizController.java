package com.hoangphihiep.controller.Teacher;

import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.QuizResponse;
import com.hoangphihiep.dto.response.QuizResultResponse;
import com.hoangphihiep.service.TeacherQuizService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/teacher/quizzes")
@RequiredArgsConstructor
@Slf4j
public class TeacherQuizController {

    private final TeacherQuizService teacherQuizService;

    @GetMapping("/class/{classId}")
    public ApiResponse<List<QuizResponse>> getQuizzesByClass(
            @PathVariable Integer classId) {

        List<QuizResponse> quizzes =
                teacherQuizService.getQuizzesByClass(classId);

        return ApiResponse.<List<QuizResponse>>builder()
                .result(quizzes)
                .build();
    }

    @GetMapping("/class/{classId}/results")
    public ApiResponse<List<QuizResultResponse>> getQuizResultsForClass(
            @PathVariable Integer classId) {

        List<QuizResultResponse> results =
                teacherQuizService.getQuizResultsForClass(classId);

        return ApiResponse.<List<QuizResultResponse>>builder()
                .result(results)
                .build();
    }

    @GetMapping("/class/{classId}/statistics")
    public ApiResponse<Map<String, Object>> getQuizStatistics(
            @PathVariable Integer classId) {

        Map<String, Object> statistics =
                teacherQuizService.getQuizStatistics(classId);

        return ApiResponse.<Map<String, Object>>builder()
                .result(statistics)
                .build();
    }
}