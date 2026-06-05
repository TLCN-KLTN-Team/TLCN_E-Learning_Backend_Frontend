package com.hoangphihiep.controller.Admin;

import com.hoangphihiep.dto.request.EducationalUnitRegistrationRequest;
import com.hoangphihiep.dto.request.EducationalUnitRequest;
import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.EducationalUnitResponse;
import com.hoangphihiep.dto.response.EducationUnitRegistrationResponse;
import com.hoangphihiep.dto.response.DepartmentStatResponse;
import com.hoangphihiep.dto.response.RecentActivityResponse;
import java.util.List;
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

        EducationalUnitResponse educational = educationalUnitService.getEducationalUnitByMemberId(currentAdminId);

        if (educational == null) {
            return ApiResponse.<EducationalUnitResponse>builder()
                    .message("Không tìm thấy đơn vị đào tạo")
                    .build();
        }
        System.out.println ("Kết quả cuối cùng: " + educational);
        return ApiResponse.<EducationalUnitResponse>builder()
                .result(educational)
                .build();
    }
    
    @GetMapping("/internal-student-ratio")
    public ApiResponse<Double> getInternalStudentRatio() {
        String currentAdminId = SecurityContextHolder.getContext().getAuthentication().getName();
        Double ratio = educationalUnitService.getAverageInternalStudentRatio(currentAdminId);
        return ApiResponse.<Double>builder()
                .result(ratio != null ? ratio : 0.0)
                .build();
    }

    @GetMapping("/department-stats")
    public ApiResponse<List<DepartmentStatResponse>> getDepartmentStats() {
        String currentAdminId = SecurityContextHolder.getContext().getAuthentication().getName();
        List<DepartmentStatResponse> stats = educationalUnitService.getDepartmentStats(currentAdminId);
        return ApiResponse.<List<DepartmentStatResponse>>builder()
                .result(stats)
                .build();
    }

    @GetMapping("/recent-activities")
    public ApiResponse<List<RecentActivityResponse>> getRecentActivities() {
        String currentAdminId = SecurityContextHolder.getContext().getAuthentication().getName();
        List<RecentActivityResponse> activities = educationalUnitService.getRecentActivities(currentAdminId);
        return ApiResponse.<List<RecentActivityResponse>>builder()
                .result(activities)
                .build();
    }

    @PostMapping(value = "/register", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<EducationUnitRegistrationResponse>> registerEducationUnit(
            @RequestPart("data") @Valid EducationalUnitRegistrationRequest request,
            @RequestPart(value = "logo", required = false) MultipartFile logo,
            @RequestPart(value = "businessLicenseSigned", required = false) MultipartFile businessLicenseSigned) {

        try {
            request.setLogo(logo);
            request.setBusinessLicenseSigned(businessLicenseSigned);

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

    @PutMapping("/my-educationalUnit")
    public ApiResponse<EducationalUnitResponse> updateMyEducationalUnit(
            @RequestBody @Valid EducationalUnitRequest request) {
        String currentAdminId = SecurityContextHolder.getContext().getAuthentication().getName();

        EducationalUnitResponse updatedUnit = educationalUnitService.updateEducationalUnit(currentAdminId, request);

        return ApiResponse.<EducationalUnitResponse>builder()
                .result(updatedUnit)
                .message("Cập nhật thông tin đơn vị đào tạo thành công")
                .build();
    }
}
