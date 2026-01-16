package com.hoangphihiep.controller.Teacher;

import com.hoangphihiep.dto.request.QuestionRequest;
import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.QuestionResponse;
import com.hoangphihiep.service.QuestionLibraryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/teacher/questions")
@RequiredArgsConstructor
@Slf4j
public class QuestionLibraryController {

    private final QuestionLibraryService questionLibraryService;

    /**
     * Get paginated list of library questions with optional filters
     * GET /api/teacher/questions?page=0&size=10&search=...&questionType=...&difficultyLevel=...
     */
    @GetMapping
    public ApiResponse<Map<String, Object>> getLibraryQuestions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String questionType,
            @RequestParam(required = false) String difficultyLevel,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection) {

        log.info("GET library questions - page: {}, size: {}, search: {}, type: {}, difficulty: {}",
                page, size, search, questionType, difficultyLevel);

        Sort sort = Sort.by(Sort.Direction.fromString(sortDirection), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<QuestionResponse> questionPage = questionLibraryService.getLibraryQuestions(
                search, questionType, difficultyLevel, pageable);

        Map<String, Object> response = new HashMap<>();
        response.put("questions", questionPage.getContent());
        response.put("currentPage", questionPage.getNumber());
        response.put("totalItems", questionPage.getTotalElements());
        response.put("totalPages", questionPage.getTotalPages());

        return ApiResponse.<Map<String, Object>>builder()
                .result(response)
                .build();
    }

    /**
     * Get a single library question by ID
     * GET /api/teacher/questions/{id}
     */
    @GetMapping("/{id}")
    public ApiResponse<QuestionResponse> getLibraryQuestionById(
            @PathVariable Integer id) {

        log.info("GET library question by ID: {}", id);

        QuestionResponse question = questionLibraryService.getLibraryQuestionById(id);

        return ApiResponse.<QuestionResponse>builder()
                .result(question)
                .build();
    }

    /**
     * Create a new library question
     * POST /api/teacher/questions
     */
    @PostMapping(consumes = {"multipart/form-data", "application/json"})
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<QuestionResponse> createLibraryQuestion(
            @Validated @RequestPart("request") QuestionRequest request,
            @RequestParam(value = "imageFiles", required = false) List<MultipartFile> imageFiles) {

        log.info("POST create library question: {}, images: {}", 
                request.getQuestionText(), imageFiles != null ? imageFiles.size() : 0);

        QuestionResponse question = questionLibraryService.createLibraryQuestion(request, imageFiles);

        return ApiResponse.<QuestionResponse>builder()
                .result(question)
                .build();
    }

    /**
     * Update an existing library question
     * PUT /api/teacher/questions/{id}
     */
    @PutMapping(value = "/{id}", consumes = {"multipart/form-data", "application/json"})
    public ApiResponse<QuestionResponse> updateLibraryQuestion(
            @PathVariable Integer id,
            @Validated @RequestPart("request") QuestionRequest request,
            @RequestParam(value = "imageFiles", required = false) List<MultipartFile> imageFiles) {

        log.info("PUT update library question ID: {}, images: {}", 
                id, imageFiles != null ? imageFiles.size() : 0);

        QuestionResponse question = questionLibraryService.updateLibraryQuestion(id, request, imageFiles);

        return ApiResponse.<QuestionResponse>builder()
                .result(question)
                .build();
    }

    /**
     * Delete a library question
     * DELETE /api/teacher/questions/{id}
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ApiResponse<Void> deleteLibraryQuestion(@PathVariable Integer id) {

        log.info("DELETE library question ID: {}", id);

        questionLibraryService.deleteLibraryQuestion(id);

        return ApiResponse.<Void>builder()
                .message("Library question deleted successfully")
                .build();
    }

    /**
     * Get count of library questions for current teacher
     * GET /api/teacher/questions/count
     */
    @GetMapping("/count")
    public ApiResponse<Map<String, Long>> getLibraryQuestionsCount() {

        log.info("GET library questions count");

        long count = questionLibraryService.getLibraryQuestionsCount();

        Map<String, Long> response = new HashMap<>();
        response.put("count", count);

        return ApiResponse.<Map<String, Long>>builder()
                .result(response)
                .build();
    }

    /**
     * Get multiple library questions by IDs (for adding to quiz)
     * POST /api/teacher/questions/batch
     */
    @PostMapping("/batch")
    public ApiResponse<List<QuestionResponse>> getLibraryQuestionsByIds(
            @RequestBody List<Integer> questionIds) {

        log.info("POST get library questions by IDs: {}", questionIds);

        List<QuestionResponse> questions = questionLibraryService.getLibraryQuestionsByIds(questionIds);

        return ApiResponse.<List<QuestionResponse>>builder()
                .result(questions)
                .build();
    }

    /**
     * Import questions from CSV file
     * POST /api/teacher/questions/import
     */
    @PostMapping("/import")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Map<String, Object>> importQuestions(
            @RequestParam("file") MultipartFile file) {

        log.info("POST import questions from file: {}", file.getOriginalFilename());

        Map<String, Object> result = questionLibraryService.importQuestionsFromCsv(file);

        return ApiResponse.<Map<String, Object>>builder()
                .result(result)
                .build();
    }
}
