package com.hoangphihiep.controller.Admin;

import com.hoangphihiep.dto.request.ExpertRequest;
import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.ExpertResponse;
import com.hoangphihiep.repository.httpclient.ExpertRepository;
import com.hoangphihiep.service.ExpertService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/educationalUnit/{educationalUnitId}")
@RequiredArgsConstructor
@Slf4j
public class ExpertController {

    private final ExpertService expertService;
    private final ExpertRepository expertRepository; 

    @GetMapping("/experts")
    public ApiResponse<Page<ExpertResponse>> getExpertsByEducationalUnit(
            @PathVariable int educationalUnitId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search) {
        
        ApiResponse<Page<ExpertResponse>> response = expertRepository.getExpertsByEducationalUnit(educationalUnitId, page, size, search);

        return ApiResponse.<Page<ExpertResponse>>builder()
                .result(response.getResult())
                .build();
    }

    @PostMapping("/experts")
    public ApiResponse<ExpertResponse> createExpert(
            @PathVariable int educationalUnitId,
            @Valid @RequestBody ExpertRequest request) {

        request.setEducationalUnitId(String.valueOf(educationalUnitId));

        ExpertResponse response = expertService.createExpert(request);

        return ApiResponse.<ExpertResponse>builder()
                .result(response)
                .build();
    }

    @GetMapping("/experts/{expertId}")
    public ApiResponse<ExpertResponse> getExpertById(
            @PathVariable int educationalUnitId,
            @PathVariable String expertId) {

        ApiResponse<ExpertResponse> response = expertRepository.getExpertByUserId(expertId); // Using ID (UUID) proxy

        return ApiResponse.<ExpertResponse>builder()
                .result(response.getResult())
                .build();
    }
    
    @PutMapping("/experts/{expertId}")
    public ApiResponse<ExpertResponse> updateExpert(
            @PathVariable int educationalUnitId,
            @PathVariable String expertId,
            @Valid @RequestBody ExpertRequest request) {

        request.setEducationalUnitId(String.valueOf(educationalUnitId));

        ExpertResponse response = expertService.updateExpert(expertId, request);

        return ApiResponse.<ExpertResponse>builder()
                .result(response)
                .build();
    }

    @PutMapping("/experts/{expertId}/status")
    public ApiResponse<ExpertResponse> updateExpertAccountStatus(
            @PathVariable int educationalUnitId,
            @PathVariable String expertId,
            @RequestParam String status) {

        log.info("Updating account status for expert {} in educational unit {} to {}",
                expertId, educationalUnitId, status);

        ExpertResponse response = expertService.updateExpertAccountStatus(expertId, status);

        return ApiResponse.<ExpertResponse>builder()
                .result(response)
                .build();
    }
    
    @DeleteMapping("/experts/{expertId}")
    public ApiResponse<Void> deleteExpert(
            @PathVariable int educationalUnitId,
            @PathVariable String expertId) {
            
        expertRepository.deleteExpert(expertId);
        
        return ApiResponse.<Void>builder().build();
    }

    @PostMapping("/experts/bulk-import")
    public ApiResponse<com.hoangphihiep.dto.response.ExpertImportResponse> bulkImportExperts(
            @PathVariable int educationalUnitId,
            @Valid @RequestBody com.hoangphihiep.dto.request.ExpertImportRequest request) {

        log.info("Bulk importing {} experts for educational unit {}",
                request.getExperts().size(), educationalUnitId);

        com.hoangphihiep.dto.response.ExpertImportResponse result = expertService.bulkImportExperts(educationalUnitId, request.getExperts());

        return ApiResponse.<com.hoangphihiep.dto.response.ExpertImportResponse>builder()
                .result(result)
                .build();
    }
}
