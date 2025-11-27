package com.hoangphihiep.controller.SystemAdmin;

import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.service.EducationalUnitService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/system-admin/education-unit-management")
@RequiredArgsConstructor
public class EducationUnitManagementController {
    private final EducationalUnitService educationalUnitService;

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

    @PutMapping("/approve/{unitId}")
    public ApiResponse<Void> approveEducationalUnit(@PathVariable Integer unitId) {
        educationalUnitService.approveEducationalUnit(unitId);

        return ApiResponse.<Void>builder()
                .message("Phê duyệt đơn vị đào tạo thành công")
                .build();
    }

    @PutMapping(value = "/reject/{unitId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<Void> rejectEducationalUnit(@PathVariable Integer unitId,
                                                   @RequestPart("reason") String reason
                                                   ) {
        educationalUnitService.rejectEducationalUnit(unitId, reason);

        return ApiResponse.<Void>builder()
                .message("Từ chối đơn vị đào tạo thành công")
                .build();
    }

    @PutMapping(value = "/change-status/{unitId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<Void> changeEducationalUnitStatus(
            @PathVariable Integer unitId,
            @RequestParam("status") String status,
            @RequestPart("reason") String reason
    ) {
        if (status.equals("reactive")) {
            educationalUnitService.reactivateEducationalUnit(unitId, reason);
            return ApiResponse.success(
                    null,
                    "Kích hoạt lại đơn vị đào tạo thành công"
            );
        } else {
            educationalUnitService.suspendEducationalUnit(unitId, reason);
            return ApiResponse.success(
                    null,
                    "Tạm ngưng đơn vị đào tạo thành công"
            );
        }
    }

    @PostMapping(value ="/send-feedback/{unitId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
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

}
