package com.hoangphihiep.controller.Admin;

import com.hoangphihiep.dto.request.TrainingUnitRegistrationRequest;
import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.EducationalUnitResponse;
import com.hoangphihiep.dto.response.TrainingUnitRegistrationResponse;
import com.hoangphihiep.exception.AppException;
import com.hoangphihiep.service.EducationalUnitService;
import com.hoangphihiep.service.EmailService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/educational-unit")
@RequiredArgsConstructor
@Slf4j
public class EducationalUnitController {
    private final EducationalUnitService educationalUnitService;
    private final EmailService emailService;

    @GetMapping("/get-all")
    public ApiResponse<?> getAllEducationalUnits(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size
    ) {

        var response = educationalUnitService.getAllEducationalUnits(page,size);
        return ApiResponse.success(
                response,
                "Lấy danh sách đơn vị đào tạo thành công"
        );
    }

    @GetMapping("/my-institution")
    public ApiResponse<EducationalUnitResponse> getMyInstitution() {
        String currentAdminId = SecurityContextHolder.getContext().getAuthentication().getName();

        log.info("Admin {} checking their institution", currentAdminId);

        EducationalUnitResponse institution = educationalUnitService.getInstitutionByAdminId(currentAdminId);

        if (institution == null) {
            return ApiResponse.<EducationalUnitResponse>builder()
                    .message("Không tìm thấy đơn vị đào tạo")
                    .build();
        }

        return ApiResponse.<EducationalUnitResponse>builder()
                .result(institution)
                .build();
    }

    @PostMapping(value = "/register", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<TrainingUnitRegistrationResponse>> registerEducationUnit(
            @RequestPart("data") @Valid TrainingUnitRegistrationRequest request,
            @RequestPart(value = "logo", required = false) MultipartFile logo,
            @RequestPart(value = "businessLicense", required = false) MultipartFile businessLicense) {

        log.info("Registering new educational unit: {}", request.getName());

        try {
            request.setLogo(logo);
            request.setBusinessLicense(businessLicense);

            TrainingUnitRegistrationResponse response = educationalUnitService.registerTrainingUnit(request);

            return ResponseEntity.ok(ApiResponse.<TrainingUnitRegistrationResponse>builder()
                    .result(response)
                    .message("Đăng ký đơn vị đào tạo thành công")
                    .build());

        } catch (AppException e) {
            log.error("Failed to register educational unit: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.<TrainingUnitRegistrationResponse>builder()
                    .message(e.getMessage())
                    .build());
        } catch (Exception e) {
            log.error("Failed to register educational unit: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(ApiResponse.<TrainingUnitRegistrationResponse>builder()
                    .message("Đăng ký đơn vị đào tạo thất bại: " + e.getMessage())
                    .build());
        }
    }
}
