package com.hoangphihiep.repository.httpclient;

import com.hoangphihiep.config.FeignClientConfig;
import com.hoangphihiep.dto.request.ExpertRequest;
import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.ExpertResponse;
import com.hoangphihiep.dto.response.PageResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@FeignClient(
        name = "identity-service",
        url = "${app.services.identity}",
        contextId = "expertRepository",
        configuration = FeignClientConfig.class
)
public interface ExpertRepository {
    @PostMapping("/experts")
    ApiResponse<ExpertResponse> createExpert(@RequestBody ExpertRequest expertRequest);

    @GetMapping("/experts/by-expert-id/{expertId}")
    ApiResponse<ExpertResponse> getExpertByExpertId(@PathVariable String expertId);

    @GetMapping("/experts/by-educationalUnit/{educationalUnitId}")
    ApiResponse<PageResponse<ExpertResponse>> getExpertsByEducationalUnit(
            @PathVariable int educationalUnitId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search);

    @GetMapping("/experts/educational-units/{educationalUnitId}")
    ApiResponse<List<ExpertResponse>> getExpertsByEducationalUnitNoPage(
            @PathVariable int educationalUnitId);

    @PutMapping("/experts/{id}")
    ApiResponse<ExpertResponse> updateExpert(@PathVariable String id, @RequestBody ExpertRequest request);

    @DeleteMapping("/experts/{id}")
    ApiResponse<Void> deleteExpert(@PathVariable String id);

    // Reuse getExpertById to find by user/expert id
    @GetMapping("/experts/{id}")
    ApiResponse<ExpertResponse> getExpertByUserId(@PathVariable("id") String userId);

    @PutMapping("/experts/{id}/status")
    ApiResponse<ExpertResponse> updateExpertAccountStatus(
            @PathVariable String id,
            @RequestParam String status);
}
