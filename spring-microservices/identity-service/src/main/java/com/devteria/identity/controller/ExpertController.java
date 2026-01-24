package com.devteria.identity.controller;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import com.devteria.identity.dto.request.ApiResponse;
import com.devteria.identity.dto.request.ExpertRequest;
import com.devteria.identity.dto.response.ExpertResponse;
import com.devteria.identity.service.ExpertService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/experts")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class ExpertController {

    ExpertService expertService;

    @PostMapping
    public ApiResponse<ExpertResponse> createExpert(@Valid @RequestBody ExpertRequest request) {
        log.info("Creating expert with expertId: {}", request.getExpertId());
        return ApiResponse.<ExpertResponse>builder()
                .result(expertService.createExpert(request))
                .build();
    }

    @PutMapping("/{id}")
    public ApiResponse<ExpertResponse> updateExpert(
            @PathVariable String id, @Valid @RequestBody ExpertRequest request) {
        log.info("Updating expert with ID: {}", id);
        return ApiResponse.<ExpertResponse>builder()
                .result(expertService.updateExpert(id, request))
                .build();
    }

    @PutMapping("/{id}/status")
    public ApiResponse<ExpertResponse> toggleAccountStatus(@PathVariable String id, @RequestParam String status) {
        log.info("Toggling account status for expert ID: {} to {}", id, status);
        return ApiResponse.<ExpertResponse>builder()
                .result(expertService.updateAccountStatus(id, status))
                .build();
    }

    @GetMapping
    public ApiResponse<Page<ExpertResponse>> getAllExperts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "expertId") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir,
            @RequestParam(required = false) String expertId,
            @RequestParam(required = false) String educationalUnitId) {

        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        return ApiResponse.<Page<ExpertResponse>>builder()
                .result(expertService.getAllExperts(expertId, educationalUnitId, pageable))
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<ExpertResponse> getExpertById(@PathVariable String id) {
        log.info("Getting expert by ID: {}", id);
        return ApiResponse.<ExpertResponse>builder()
                .result(expertService.getExpertById(id))
                .build();
    }

    @GetMapping("/by-expert-id/{expertId}")
    public ApiResponse<ExpertResponse> getExpertByExpertId(@PathVariable String expertId) {
        log.info("Getting expert by expertId: {}", expertId);
        return ApiResponse.<ExpertResponse>builder()
                .result(expertService.getExpertByExpertId(expertId))
                .build();
    }

    @GetMapping("/by-educationalUnit/{educationalUnitId}")
    public ApiResponse<Page<ExpertResponse>> getExpertsByEducationalUnit(
            @PathVariable int educationalUnitId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("expertId").ascending());

        return ApiResponse.<Page<ExpertResponse>>builder()
                .result(expertService.getExpertsByEducationalUnit(educationalUnitId, search, pageable))
                .build();
    }

    @GetMapping("/educational-units/{educationalUnitId}")
    public ApiResponse<List<ExpertResponse>> getExpertsByEducationalUnitNoPage(@PathVariable int educationalUnitId) {
        return ApiResponse.<List<ExpertResponse>>builder()
                .result(expertService.getExpertsByEducationalUnitId(educationalUnitId))
                .build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteExpert(@PathVariable String id) {
        log.info("Deleting expert with ID: {}", id);
        expertService.deleteExpert(id);
        return ApiResponse.<Void>builder().build();
    }

    @GetMapping("/count-by-educational-unit/{educationalUnitId}")
    public ApiResponse<Long> countExpertsByEducationalUnit(@PathVariable Integer educationalUnitId) {
        log.info("Counting experts for educational unit: {}", educationalUnitId);
        return ApiResponse.<Long>builder()
                .result(expertService.countByEducationalUnit(educationalUnitId))
                .build();
    }
}
