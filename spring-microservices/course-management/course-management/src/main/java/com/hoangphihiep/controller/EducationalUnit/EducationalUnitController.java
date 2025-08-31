package com.hoangphihiep.controller.EducationalUnit;

import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.EducationalUnitResponse;
import com.hoangphihiep.service.EducationalUnitService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
}
