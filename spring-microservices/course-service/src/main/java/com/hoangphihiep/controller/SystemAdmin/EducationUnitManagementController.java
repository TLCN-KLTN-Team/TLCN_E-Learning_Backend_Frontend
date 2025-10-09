package com.hoangphihiep.controller.SystemAdmin;

import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.service.EducationalUnitService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/system-admin/education-unit-management")
@RequiredArgsConstructor
public class EducationUnitManagementController {
    private final EducationalUnitService educationalUnitService;

    @PutMapping("/approve")
    public ApiResponse<Void> approveEducationalUnit(@RequestParam Integer unitId) {
        educationalUnitService.approveEducationalUnit(unitId);

        return ApiResponse.<Void>builder()
                .message("Phê duyệt đơn vị đào tạo thành công")
                .build();
    }

    @PostMapping("/send-feedback")
    public ApiResponse<Void> sendFeedbackToEducationalUnit(
            @RequestParam Integer unitId,
            @RequestParam String feedback
    ) {
        educationalUnitService.sendFeedback(unitId, feedback);
        return ApiResponse.success(
                null,
                "Gửi phản hồi đến đơn vị đào tạo thành công"
        );
    }
}
