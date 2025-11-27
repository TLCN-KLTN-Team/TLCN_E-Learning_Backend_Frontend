package com.hoangphihiep.controller.Admin;

import com.hoangphihiep.dto.request.EducationalUnitRegistrationRequest;
import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.EducationalUnitResponse;
import com.hoangphihiep.dto.response.EducationUnitRegistrationResponse;
import com.hoangphihiep.exception.AppException;
import com.hoangphihiep.service.EducationalUnitService;
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

    @GetMapping("/my-educationalUnit")
    public ApiResponse<EducationalUnitResponse> getMyEducationalUnit() {
        String currentAdminId = SecurityContextHolder.getContext().getAuthentication().getName();

        EducationalUnitResponse institution = educationalUnitService.getEducationalUnitByAdminId(currentAdminId);

        if (institution == null) {
            return ApiResponse.<EducationalUnitResponse>builder()
                    .message("Không tìm thấy đơn vị đào tạo")
                    .build();
        }
        System.out.println ("Kết quả cuối cùng: " + institution);
        return ApiResponse.<EducationalUnitResponse>builder()
                .result(institution)
                .build();
    }

    @PostMapping(value = "/register", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<EducationUnitRegistrationResponse>> registerEducationUnit(
            @RequestPart("data") @Valid EducationalUnitRegistrationRequest request,
            @RequestPart(value = "logo", required = false) MultipartFile logo,
            @RequestPart(value = "businessLicense", required = false) MultipartFile businessLicense) {

        try {
            request.setLogo(logo);
            request.setBusinessLicense(businessLicense);

            EducationUnitRegistrationResponse response = educationalUnitService.registerEducationalUnit(request);

            return ResponseEntity.ok(ApiResponse.<EducationUnitRegistrationResponse>builder()
                    .result(response)
                    .message("Đăng ký đơn vị đào tạo thành công")
                    .build());

        } catch (AppException e) {
            return ResponseEntity.badRequest().body(ApiResponse.<EducationUnitRegistrationResponse>builder()
                    .message(e.getMessage())
                    .build());
        } catch (Exception e) {
            return ResponseEntity.status(500).body(ApiResponse.<EducationUnitRegistrationResponse>builder()
                    .message("Đăng ký đơn vị đào tạo thất bại: " + e.getMessage())
                    .build());
        }
    }
}
