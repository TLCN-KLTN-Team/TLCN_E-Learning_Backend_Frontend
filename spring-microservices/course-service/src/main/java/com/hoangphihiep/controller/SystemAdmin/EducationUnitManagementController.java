package com.hoangphihiep.controller.SystemAdmin;

import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.request.StatusUpdateRequest;
import com.hoangphihiep.service.EducationalUnitService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/super-admin/education-unit-management")
@RequiredArgsConstructor
public class EducationUnitManagementController {
    private final EducationalUnitService educationalUnitService;

    @GetMapping("/get-all")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ApiResponse<?> getAllEducationalUnits(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size
    ) {

        var response = educationalUnitService.getAllEducationalUnitsAtSuperAdmin(page,size);
        return ApiResponse.success(
                response,
                "Lấy danh sách đơn vị đào tạo thành công"
        );
    }

    @PostMapping(value ="/send-feedback/{unitId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ApiResponse<Void> sendFeedbackToEducationalUnit(
            @PathVariable Integer unitId,
            @RequestPart("feedback") String feedback
    ) {
        educationalUnitService.sendFeedback(unitId, feedback);
        return ApiResponse.success(
                null,
                "Gửi phản hồi đến đơn vị đào tạo thành công"
        );
    }

    @PutMapping("/approve/{unitId}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ApiResponse<Void> approveEducationalUnit(@PathVariable Integer unitId) {
        educationalUnitService.approveEducationalUnit(unitId);

        return ApiResponse.<Void>builder()
                .message("Phê duyệt đơn vị đào tạo thành công")
                .build();
    }

        @PutMapping("/reverify-signature/{unitId}")
        @PreAuthorize("hasRole('SUPER_ADMIN')")
        public ApiResponse<Void> reverifySignature(@PathVariable Integer unitId) {
                educationalUnitService.reverifyEducationalUnitSignature(unitId);

                return ApiResponse.<Void>builder()
                                .message("Xác thực lại chữ ký số thành công")
                                .build();
        }

    @PutMapping(value = "/reject/{unitId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ApiResponse<Void> rejectEducationalUnit(@PathVariable Integer unitId,
                                                   @RequestPart("reason") String reason
                                                   ) {
        educationalUnitService.rejectEducationalUnit(unitId, reason);

        return ApiResponse.<Void>builder()
                .message("Từ chối đơn vị đào tạo thành công")
                .build();
    }

    @PutMapping("/update-status/{unitId}")
    public ApiResponse<?> updateStatusEducationalUnit(@PathVariable Integer unitId,
                                                      @RequestBody StatusUpdateRequest request) {
        request.setUnitId(unitId);
        String res = educationalUnitService.updateStatusEducationalUnit(request);
        return ApiResponse.builder()
                .message(res)
                .build();
    }

}
