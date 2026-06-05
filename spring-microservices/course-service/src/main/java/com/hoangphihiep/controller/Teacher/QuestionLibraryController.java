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

    @GetMapping
    public ApiResponse<Map<String, Object>> getLibraryQuestions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String questionType,
            @RequestParam(required = false) String difficultyLevel,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection) {

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

    @PostMapping(consumes = {"multipart/form-data", "application/json"})
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<QuestionResponse> createLibraryQuestion(
            @Validated @RequestPart("request") QuestionRequest request,
            @RequestParam(value = "imageFiles", required = false) List<MultipartFile> imageFiles) {

        QuestionResponse question = questionLibraryService.createLibraryQuestion(request, imageFiles);

        return ApiResponse.<QuestionResponse>builder()
                .result(question)
                .build();
    }

    @PutMapping(value = "/{id}", consumes = {"multipart/form-data", "application/json"})
    public ApiResponse<QuestionResponse> updateLibraryQuestion(
            @PathVariable Integer id,
            @Validated @RequestPart("request") QuestionRequest request,
            @RequestParam(value = "imageFiles", required = false) List<MultipartFile> imageFiles) {

        QuestionResponse question = questionLibraryService.updateLibraryQuestion(id, request, imageFiles);

        return ApiResponse.<QuestionResponse>builder()
                .result(question)
                .build();
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ApiResponse<Void> deleteLibraryQuestion(@PathVariable Integer id) {

        questionLibraryService.deleteLibraryQuestion(id);

        return ApiResponse.<Void>builder()
                .message("Library question deleted successfully")
                .build();
    }

    @PostMapping("/import")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Map<String, Object>> importQuestions(
            @RequestParam("file") MultipartFile file,
            @RequestParam("cloId") Integer cloId) {

        Map<String, Object> result = questionLibraryService.importQuestionsFromCsv(file, cloId);

        return ApiResponse.<Map<String, Object>>builder()
                .result(result)
                .build();
    }
}
