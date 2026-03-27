package com.hoangphihiep.controller.Teacher;

import com.hoangphihiep.dto.request.QuizBlueprintRequest;
import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.QuizBlueprintResponse;
import com.hoangphihiep.entity.QuizBlueprint;
import com.hoangphihiep.service.QuizBlueprintService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/teacher/quizzes/{quizId}/blueprint")
@RequiredArgsConstructor
@Slf4j
public class TeacherQuizBlueprintController {

    private final QuizBlueprintService quizBlueprintService;

    @GetMapping
    public ApiResponse<List<QuizBlueprintResponse>> getBlueprintByQuizId(
            @PathVariable Integer quizId) {

        List<QuizBlueprintResponse> responses = quizBlueprintService.getBlueprintByQuizId(quizId)
                .stream()
                .map(this::toResponse)
                .toList();

        return ApiResponse.<List<QuizBlueprintResponse>>builder()
                .result(responses)
                .build();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<QuizBlueprintResponse> addBlueprintEntry(
            @PathVariable Integer quizId,
            @Valid @RequestBody QuizBlueprintRequest request) {

        QuizBlueprint blueprint = quizBlueprintService.addCLOToBlueprint(
                quizId,
                request.getCloId(),
                request.getPercentage()
        );

        return ApiResponse.<QuizBlueprintResponse>builder()
                .result(toResponse(blueprint))
                .build();
    }

    @PutMapping("/{cloId}")
    public ApiResponse<QuizBlueprintResponse> updateBlueprintEntry(
            @PathVariable Integer quizId,
            @PathVariable Integer cloId,
            @Valid @RequestBody QuizBlueprintRequest request) {

        QuizBlueprint blueprint = quizBlueprintService.updateCLOPercentage(
                quizId,
                cloId,
                request.getPercentage()
        );

        return ApiResponse.<QuizBlueprintResponse>builder()
                .result(toResponse(blueprint))
                .build();
    }

    @DeleteMapping("/{cloId}")
    public ApiResponse<Void> removeBlueprintEntry(
            @PathVariable Integer quizId,
            @PathVariable Integer cloId) {

        quizBlueprintService.removeCLOFromBlueprint(quizId, cloId);

        return ApiResponse.<Void>builder()
                .message("Blueprint entry removed successfully")
                .build();
    }

    @DeleteMapping
    public ApiResponse<Void> clearBlueprint(
            @PathVariable Integer quizId) {

        quizBlueprintService.clearBlueprint(quizId);

        return ApiResponse.<Void>builder()
                .message("Blueprint cleared successfully")
                .build();
    }

    @GetMapping("/summary")
    public ApiResponse<Map<String, Object>> getBlueprintSummary(
            @PathVariable Integer quizId) {

        Double totalPercentage = quizBlueprintService.getTotalPercentage(quizId);
        boolean complete = quizBlueprintService.isBlueprintComplete(quizId);

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalPercentage", totalPercentage);
        summary.put("complete", complete);

        return ApiResponse.<Map<String, Object>>builder()
                .result(summary)
                .build();
    }

    @PostMapping("/validate")
    public ApiResponse<Map<String, Object>> validateBlueprint(
            @PathVariable Integer quizId) {

        quizBlueprintService.validateBlueprintTotalPercentage(quizId);

        Map<String, Object> response = new HashMap<>();
        response.put("valid", true);
        response.put("message", "Blueprint is valid with total percentage = 100%");

        return ApiResponse.<Map<String, Object>>builder()
                .result(response)
                .build();
    }

    private QuizBlueprintResponse toResponse(QuizBlueprint blueprint) {
        return QuizBlueprintResponse.builder()
                .id(blueprint.getId())
                .quizId(blueprint.getQuiz().getId())
                .cloId(blueprint.getCourseObjective().getId())
                .cloCode(blueprint.getCourseObjective().getCode())
                .cloDescription(blueprint.getCourseObjective().getDescription())
                .percentage(blueprint.getPercentage())
                .createdAt(blueprint.getCreatedAt())
                .updatedAt(blueprint.getUpdatedAt())
                .build();
    }
}
