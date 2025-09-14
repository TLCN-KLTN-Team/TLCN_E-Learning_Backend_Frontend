package com.hoangphihiep.controller.EducationalUnit;

import com.hoangphihiep.dto.request.TrainingUnitRegistrationRequest;
import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.EducationalUnitResponse;
import com.hoangphihiep.dto.response.TrainingUnitRegistrationResponse;
import com.hoangphihiep.service.EducationalUnitService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/educational-unit")
@RequiredArgsConstructor
@Slf4j
public class EducationalUnitController {
    private final EducationalUnitService educationalUnitService;

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
    public ApiResponse<TrainingUnitRegistrationResponse> registerEducationUnit(
            @RequestPart("data") @Valid TrainingUnitRegistrationRequest request,
            @RequestPart(value = "logo", required = false) MultipartFile logo,
            @RequestPart(value = "businessLicense", required = false) MultipartFile businessLicense) {

        log.info("Registering new educational unit: {}", request.getName());

        try {
            // Set files to request
            request.setLogo(logo);
            request.setBusinessLicense(businessLicense);

            System.out.println("logo: " + logo);
            System.out.println("license: " + businessLicense);

            TrainingUnitRegistrationResponse response = educationalUnitService.registerTrainingUnit(request);

            return ApiResponse.<TrainingUnitRegistrationResponse>builder()
                    .result(response)
                    .message("Đăng ký đơn vị đào tạo thành công")
                    .build();

        } catch (Exception e) {
            log.error("Failed to register educational unit: {}", e.getMessage(), e);
            return ApiResponse.<TrainingUnitRegistrationResponse>builder()
                    .message("Đăng ký đơn vị đào tạo thất bại: " + e.getMessage())
                    .build();
        }
    }
}
